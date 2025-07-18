(ns metabase.queue.core
  "The cluster-wide queue"
  (:require
   [metabase.queue.appdb :as q.appdb]
   [metabase.queue.backend :as q.backend]
   [metabase.queue.impl :as q.impl]
   [metabase.queue.listener :as q.listener]
   [metabase.queue.memory :as q.memory]

   [metabase.util.log :as log]
   [potemkin :as p])
  (:import (clojure.lang Counted)))

(set! *warn-on-reflection* true)

(comment
  (q.memory/keep-me)
  (q.appdb/keep-me)
  (q.listener/keep-me))

(p/import-vars
 [q.listener
  listen!]

 [q.impl
  define-queue!])

(defprotocol QueueBuffer
  (put [this msg]
    "Put a message on the queue"))

(deftype ListQueueBuffer [buffer]
  QueueBuffer
  (put [_this msg]
    (swap! buffer conj msg))

  Counted
  (count [_this]
    (count @buffer)))

(defn publish! [queue-name message]
  "Publishes message to the given queue."
  (q.backend/publish! q.backend/*backend* queue-name message))

(defmacro with-queue
  "Runs the body with the ability to add messages to the given queue"
  [queue-name [queue-binding] & body]
  `(let [~queue-binding (->ListQueueBuffer (atom []))]
     (try
       (do ~@body)
       (q.backend/publish! q.backend/*backend* ~queue-name @(.buffer ~queue-binding))
       (catch Exception e#
         (log/error e# "Error in queue processing, no messages will be persisted to the queue")))))

(defn clear-queue!
  "Deletes all persisted messages from the given queue.
  This is a destructive operation and should be used with caution. Mostly for testing."
  [queue-name]
  (q.backend/clear-queue! q.backend/*backend* queue-name))

(defn queue-length
  "The number of messages in the queue."
  [queue-name]
  (q.backend/queue-length q.backend/*backend* queue-name))

(defn- response-handler [{:keys [success error]} [status response]]
  (case status
    :success (success response {})
    :error (error response {})))

(defn stop-listening!
  [queue-name]
  (q.backend/close-queue! q.backend/*backend* queue-name))
