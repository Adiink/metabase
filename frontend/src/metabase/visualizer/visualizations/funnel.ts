import type { DragEndEvent } from "@dnd-kit/core";

import { DROPPABLE_ID } from "metabase/visualizer/constants";
import {
  addColumnMapping,
  copyColumn,
  createDataSourceNameRef,
  createVisualizerColumnReference,
  extractReferencedColumns,
  isDraggedColumnItem,
} from "metabase/visualizer/utils";
import { isNumeric } from "metabase-lib/v1/types/utils/isa";
import type { Card, Dataset, DatasetColumn } from "metabase-types/api";
import type {
  VisualizerDataSource,
  VisualizerHistoryItem,
} from "metabase-types/store/visualizer";

export const funnelDropHandler = (
  state: VisualizerHistoryItem,
  { active, over }: DragEndEvent,
) => {
  if (!over || !isDraggedColumnItem(active)) {
    return;
  }

  const { column, dataSource } = active.data.current;

  if (over.id === DROPPABLE_ID.CANVAS_MAIN && isNumeric(column)) {
    addScalarToFunnel(state, dataSource, column);
  }
};

export function canCombineCardWithFunnel(card: Card, dataset: Dataset) {
  return (
    card.display === "scalar" &&
    dataset.data?.cols?.length === 1 &&
    isNumeric(dataset.data.cols[0]) &&
    dataset.data.rows?.length === 1
  );
}

export function addScalarToFunnel(
  state: VisualizerHistoryItem,
  dataSource: VisualizerDataSource,
  column: DatasetColumn,
) {
  const columnRef = createVisualizerColumnReference(
    dataSource,
    column,
    extractReferencedColumns(state.columnValuesMapping),
  );

  let metricColumnName = state.settings["funnel.metric"];
  let dimensionColumnName = state.settings["funnel.dimension"];

  if (!metricColumnName) {
    metricColumnName = columnRef.name;
    state.columns.push(copyColumn(metricColumnName, column));
    state.settings["funnel.metric"] = metricColumnName;
  }
  if (!dimensionColumnName) {
    dimensionColumnName = "DIMENSION";
    state.columns.push(createDimensionColumn(dimensionColumnName));
    state.settings["funnel.dimension"] = dimensionColumnName;
  }

  state.columnValuesMapping[metricColumnName] = addColumnMapping(
    state.columnValuesMapping[metricColumnName],
    columnRef,
  );
  state.columnValuesMapping[dimensionColumnName] = addColumnMapping(
    state.columnValuesMapping[dimensionColumnName],
    createDataSourceNameRef(dataSource.id),
  );
}

function createDimensionColumn(name: string): DatasetColumn {
  return {
    name,
    display_name: name,
    base_type: "type/Text",
    effective_type: "type/Text",
    field_ref: ["field", name, { "base-type": "type/Text" }],
    source: "artificial",
  };
}
