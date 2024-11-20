import type { Ace } from "ace-builds";
import * as ace from "ace-builds/src-noconflict/ace";
import { Component, createRef } from "react";
import slugg from "slugg";
import { t } from "ttag";
import _ from "underscore";

import "ace/ace";
import "ace/ext-language_tools";
import "ace/ext-searchbox";
import "ace/mode-sql";
import "ace/mode-json";
import "ace/snippets/text";
import "ace/snippets/sql";
import "ace/snippets/json";

import { SQLBehaviour } from "metabase/lib/ace/sql_behaviour";
import { isEventOverElement } from "metabase/lib/dom";
import { getEngineNativeAceMode } from "metabase/lib/engine";
import { checkNotNull } from "metabase/lib/types";
import { CARD_TAG_REGEX } from "metabase-lib/v1/queries/NativeQuery";

import type { EditorProps } from "./Editor";
import { EditorRoot } from "./NativeQueryEditor.styled";
import { ACE_ELEMENT_ID, SCROLL_MARGIN } from "./constants";
import type { AutocompleteItem } from "./types";
import { getAutocompleteResultMeta } from "./utils";

import "./AceEditor.global.css";

const AUTOCOMPLETE_DEBOUNCE_DURATION = 700;
const AUTOCOMPLETE_CACHE_DURATION = AUTOCOMPLETE_DEBOUNCE_DURATION * 1.2; // tolerate 20%

type AceCompletionsGetter = Ace.Completer["getCompletions"];

type LastAutoComplete = {
  timestamp: number;
  prefix: string | null;
  results: AutocompleteItem[];
};

export class AceEditor extends Component<EditorProps> {
  editor = createRef<HTMLDivElement>();

  // this is overwritten when the editor mounts
  nextCompleters?: (position: Ace.Position) => Ace.Completer[] = undefined;

  _editor: Ace.Editor | null = null;
  _localUpdate = false;
  _focusFrame: number = -1;

  componentDidMount() {
    this.loadAceEditor();
    document.addEventListener("contextmenu", this.handleRightClick);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this._focusFrame);
    document.removeEventListener("contextmenu", this.handleRightClick);
    this._editor?.destroy?.();
  }

  componentDidUpdate(prevProps: EditorProps) {
    const { query, readOnly } = this.props;
    if (!query || !this._editor) {
      return;
    }

    if (
      this.props.isSelectedTextPopoverOpen &&
      !this.props.nativeEditorSelectedText &&
      prevProps.nativeEditorSelectedText
    ) {
      // close selected text popover if text is deselected
      this.props.onToggleSelectedTextContextMenu(false);
    }
    // Check that the query prop changed before updating the editor. Otherwise,
    // we might overwrite just typed characters before onChange is called.
    const queryPropUpdated = this.props.query !== prevProps.query;
    if (queryPropUpdated && this._editor.getValue() !== query.queryText()) {
      // This is a weird hack, but the purpose is to avoid an infinite loop caused by the fact that calling editor.setValue()
      // will trigger the editor 'change' event, update the query, and cause another rendering loop which we don't want, so
      // we need a way to update the editor without causing the onChange event to go through as well
      this._localUpdate = true;
      this.handleQueryUpdate(query.queryText());
      this._localUpdate = false;
    }

    const editorElement = this.editor.current;

    if (query.hasWritePermission() && !readOnly) {
      this._editor.setReadOnly(false);
      editorElement?.classList.remove("read-only");
    } else {
      this._editor.setReadOnly(true);
      editorElement?.classList.add("read-only");
    }

    const aceMode = getEngineNativeAceMode(query.engine());
    const session = this._editor.getSession();

    if (session.$modeId !== aceMode) {
      session.setMode(aceMode);
      if (aceMode.indexOf("sql") >= 0) {
        // monkey patch the mode to add our bracket/paren/braces-matching behavior
        // @ts-expect-error — SQLBehaviour isn't a class
        session.$mode.$behaviour = new SQLBehaviour();

        // add highlighting rule for template tags
        session.$mode.$highlightRules.$rules.start.unshift({
          token: "templateTag",
          regex: "{{[^}]*}}",
          onMatch: null,
        });
        session.$mode.$tokenizer = null;
        session.bgTokenizer.setTokenizer(session.$mode.getTokenizer());
        session.bgTokenizer.start(0);
      }
    }

    if (this.props.width !== prevProps.width && this._editor) {
      this._editor.resize();
    }
  }

  focus() {
    // HACK: the cursor doesn't blink without this intended small delay
    // HACK: the editor injects newlines into the query without this small delay
    this._focusFrame = window.requestAnimationFrame(() =>
      this._editor?.focus(),
    );
  }

  resize() {
    this._editor?.resize();
  }

  getSelectionTarget() {
    return this.editor.current?.querySelector(".ace_selection") ?? null;
  }

  loadAceEditor() {
    const { query } = this.props;

    const editorElement = this.editor.current;

    if (typeof ace === "undefined" || !ace || !ace.edit) {
      // fail gracefully-ish if ace isn't available, e.x. in integration tests
      return;
    }

    const editor = checkNotNull<Ace.Editor>(ace.edit(editorElement));
    this._editor = editor;

    // listen to onChange events
    editor.getSession().on("change", this.onChange);
    editor.getSelection().on("changeCursor", this.handleCursorChange);
    editor.getSelection().on("changeSelection", this.handleSelectionChange);

    const minLineNumberWidth = 20;
    editor.getSession().gutterRenderer = {
      getWidth: (session, lastLineNumber, config) =>
        Math.max(
          minLineNumberWidth,
          lastLineNumber.toString().length * config.characterWidth,
        ),
      getText: (session, row) => row + 1,
    };

    // initialize the content
    this.handleQueryUpdate(query?.queryText() ?? "");
    editor.renderer.setScrollMargin(SCROLL_MARGIN, SCROLL_MARGIN, 0, 0);

    // reset undo manager to prevent undoing to empty editor
    editor.getSession().getUndoManager().reset();

    const aceLanguageTools = ace.require("ace/ext/language_tools");
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: false,
      enableLiveAutocompletion: true,
      showPrintMargin: false,
      highlightActiveLine: false,
      highlightGutterLine: false,
      showLineNumbers: true,
    });

    let lastAutoComplete: LastAutoComplete = {
      timestamp: 0,
      prefix: "",
      results: [],
    };

    const prepareResultsForAce = (results: [string, string][]) =>
      results.map(([name, meta]) => ({
        name: name,
        value: name,
        meta: meta,
      }));

    aceLanguageTools.addCompleter({
      getCompletions: async (
        _editor: Ace.Editor,
        _session: Ace.EditSession,
        _pos: Ace.Position,
        prefix: string,
        callback: Ace.CompleterCallback,
      ) => {
        if (!this.props.autocompleteResultsFn) {
          return callback(null, []);
        }

        try {
          if (prefix.length <= 1 && prefix !== lastAutoComplete.prefix) {
            // ACE triggers an autocomplete immediately when the user starts typing that is
            // not debounced by debouncing _retriggerAutocomplete.
            // Here we prevent it from actually calling the autocomplete endpoint.
            // It will run eventually even if the prefix is only one character,
            // after the user stops typing, because _retriggerAutocomplete will get called with the same prefix.
            lastAutoComplete = {
              timestamp: 0,
              prefix,
              results: lastAutoComplete.results,
            };

            callback(null, prepareResultsForAce(lastAutoComplete.results));
            return;
          }

          let { results, timestamp } = lastAutoComplete;
          const cacheHit =
            Date.now() - timestamp < AUTOCOMPLETE_CACHE_DURATION &&
            lastAutoComplete.prefix === prefix;

          if (!cacheHit) {
            // Get models and fields from tables
            // HACK: call this.props.autocompleteResultsFn rather than caching the prop since it might change
            const apiResults = await this.props.autocompleteResultsFn(prefix);
            lastAutoComplete = {
              timestamp: Date.now(),
              prefix,
              results: apiResults,
            };

            // Get referenced questions
            const referencedQuestionIds =
              this.props.query.referencedQuestionIds();
            // The results of the API call are cached by ID
            const referencedCards = await Promise.all(
              referencedQuestionIds.map(id => this.props.fetchQuestion(id)),
            );

            // Get columns from referenced questions that match the prefix
            const lowerCasePrefix = prefix.toLowerCase();
            const isMatchForPrefix = (name: string) =>
              name.toLowerCase().includes(lowerCasePrefix);
            const questionColumns: AutocompleteItem[] = referencedCards
              .filter(Boolean)
              .flatMap(card =>
                card.result_metadata
                  .filter(columnMetadata =>
                    isMatchForPrefix(columnMetadata.name),
                  )
                  .map(
                    columnMetadata =>
                      [
                        columnMetadata.name,
                        `${card.name} :${columnMetadata.base_type}`,
                      ] as AutocompleteItem,
                  ),
              );

            // Concat the results from tables, fields, and referenced questions.
            // The ace editor will deduplicate results based on name, keeping results
            // that come first. In case of a name conflict, prioritise referenced
            // questions' columns over tables and fields.
            results = questionColumns.concat(apiResults);
          }

          // transform results into what ACE expects
          callback(null, prepareResultsForAce(results));
        } catch (error) {
          console.error("error getting autocompletion data", error);
          callback(null, []);
        }
      },
    });

    // the completers when the editor mounts are the standard ones
    const standardCompleters = [...this._editor.completers];

    this.nextCompleters = pos => {
      if (this.getSnippetNameAtCursor(pos)) {
        return [{ getCompletions: this.getSnippetCompletions }];
      } else if (this.getCardTagNameAtCursor(pos)) {
        return [{ getCompletions: this.getCardTagCompletions }];
      } else {
        return standardCompleters;
      }
    };
  }

  // Ace sometimes fires multiple "change" events in rapid succession
  // e.x. https://github.com/metabase/metabase/issues/2801
  onChange = _.debounce(() => {
    if (!this._editor || this._localUpdate) {
      return;
    }
    this.props.onChange(this._editor.getValue());
    this._retriggerAutocomplete();
  }, 1);

  _retriggerAutocomplete = _.debounce(() => {
    if (this._editor?.completer?.popup?.isOpen) {
      this._editor.execCommand("startAutocomplete");
    }
  }, AUTOCOMPLETE_DEBOUNCE_DURATION);

  handleSelectionChange = () => {
    if (this._editor && this.props.setNativeEditorSelectedRange) {
      this.props.setNativeEditorSelectedRange(this._editor.getSelectionRange());
    }
  };

  handleCursorChange = _.debounce(
    (e: Event, { cursor }: { cursor: Ace.Position }) => {
      if (this._editor && this.nextCompleters) {
        this._editor.completers = this.nextCompleters(cursor);
      }

      if (this._editor && this.props.setNativeEditorSelectedRange) {
        this.props.setNativeEditorSelectedRange(
          this._editor.getSelectionRange(),
        );
      }

      const cardTagId = this.cardTagIdAtCursor(cursor);
      if (cardTagId) {
        this.props.openDataReferenceAtQuestion(cardTagId);
      }
    },
    100,
  );

  handleQueryUpdate = (queryText: string) => {
    this._editor?.setValue(queryText);
    this._editor?.clearSelection();
  };

  handleRightClick = (event: MouseEvent) => {
    // Ace creates multiple selection elements which collectively cover the selected area.
    const selections = Array.from(document.querySelectorAll(".ace_selection"));

    if (
      this.props.nativeEditorSelectedText &&
      // For some reason the click doesn't target the selection element directly.
      // We check if it falls in the selections bounding rectangle to know if the selected text was clicked.
      selections.some(selection => isEventOverElement(event, selection))
    ) {
      event.preventDefault();
      this.props.onToggleSelectedTextContextMenu(true);
    }
  };

  getSnippetNameAtCursor = ({ row, column }: Ace.Position) => {
    if (!this._editor) {
      return null;
    }
    const lines = this._editor.getValue().split("\n");
    const linePrefix = lines[row].slice(0, column);
    const match = linePrefix.match(/\{\{\s*snippet:\s*([^\}]*)$/);
    return match?.[1] || null;
  };

  getCardTagNameAtCursor = ({ row, column }: Ace.Position) => {
    if (!this._editor) {
      return null;
    }
    const lines = this._editor.getValue().split("\n");
    const linePrefix = lines[row].slice(0, column);
    const match = linePrefix.match(/\{\{\s*(#[^\}]*)$/);
    return match?.[1] || null;
  };

  cardTagIdAtCursor = ({ row, column }: Ace.Position) => {
    if (!this._editor) {
      return null;
    }
    const line = this._editor.getValue().split("\n")[row];
    const matches = Array.from(line.matchAll(CARD_TAG_REGEX));

    const match = matches.find(
      m =>
        typeof m.index === "number" &&
        column > m.index &&
        column < m.index + m[0].length,
    );
    const idStr = match?.[2];

    return (idStr && parseInt(idStr, 10)) || null;
  };

  getSnippetCompletions: AceCompletionsGetter = (
    editor,
    session,
    pos,
    prefix,
    callback,
  ) => {
    const name = this.getSnippetNameAtCursor(pos);

    if (!name) {
      callback(null, []);
      return;
    }

    const snippets = (this.props.snippets || []).filter(snippet =>
      snippet.name.toLowerCase().includes(name.toLowerCase()),
    );

    callback(
      null,
      snippets.map(({ name }) => ({
        name,
        value: name,
      })),
    );
  };

  getCardTagCompletions: AceCompletionsGetter = async (
    editor,
    session,
    pos,
    prefix,
    callback,
  ) => {
    // This ensures the user is only typing the first "word" considered by the autocompleter
    // inside the {{#...}} tag.
    // e.g. if `|` is the cursor position and the user is typing:
    //   - {{#123-foo|}} will fetch completions for the word "123-foo"
    //   - {{#123 foo|}} will not fetch completions because the word "foo" is not the first word in the tag.
    // Note we need to drop the leading `#` from the card tag name because the prefix only includes alphanumerics
    const tagNameAtCursor = this.getCardTagNameAtCursor(pos);
    if (prefix !== tagNameAtCursor?.substring?.(1)) {
      callback(null, []);
    }
    const apiResults = await this.props.cardAutocompleteResultsFn(prefix);

    const resultsForAce = apiResults.map(
      ({ id, name, type, collection_name }) => {
        const collectionName = collection_name || t`Our analytics`;
        return {
          name: `${id}-${slugg(name)}`,
          value: `${id}-${slugg(name)}`,
          meta: getAutocompleteResultMeta(type, collectionName),
          score: type === "model" ? 100000 : 0, // prioritize models above questions
        };
      },
    );
    callback(null, resultsForAce);
  };

  render() {
    return (
      <EditorRoot
        id={ACE_ELEMENT_ID}
        data-testid="native-query-editor"
        ref={this.editor}
      />
    );
  }
}
