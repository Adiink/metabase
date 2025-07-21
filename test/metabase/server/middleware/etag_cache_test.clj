(ns metabase.server.middleware.etag-cache-test
  (:require
   [clojure.test                     :refer :all]
   [metabase.config.core             :as config]
   [metabase.server.middleware.etag-cache :as mw.etag-cache]))

(set! *warn-on-reflection* true)

(deftest matches-metabase-version?-test
  (let [v           config/mb-version-string
        quoted      (str "\"" v "\"")
        weak-quoted (str "W/" quoted)
        wrong       "\"not-the-version\""]
    (testing "returns true for exact quoted ETag"
      (is (true? (mw.etag-cache/matches-metabase-version? quoted))))
    (testing "returns true for weak ETag"
      (is (true? (mw.etag-cache/matches-metabase-version? weak-quoted))))
    (testing "returns false for non-matching value"
      (is (false? (mw.etag-cache/matches-metabase-version? wrong))))
    (testing "returns nil for nil input"
      (is (nil? (mw.etag-cache/matches-metabase-version? nil))))))

(deftest not-modified-response-test
  (let [resp mw.etag-cache/not-modified-response
        hdrs (:headers resp)]
    (testing "status is 304"
      (is (= 304 (:status resp))))
    (testing "body is empty string"
      (is (= "" (:body resp))))
    (testing "contains exactly the configured cache headers"
      (is (= mw.etag-cache/etag-headers-for-metabase-version hdrs)))))

(deftest js-response-with-etag-test
  (let [dummy-body  "console.log('hello');"
        base-resp   {:status  200
                     :headers {}
                     :body    dummy-body}
        resp        (mw.etag-cache/js-response-with-etag base-resp)
        hdrs        (:headers resp)]
    (testing "status is unchanged"
      (is (= 200 (:status resp))))
    (testing "body is preserved"
      (is (= dummy-body (:body resp))))
    (testing "Content-Type is set to JavaScript"
      (is (= "application/javascript; charset=UTF-8"
             (get hdrs "Content-Type"))))
    (testing "ETag and Cache-Control headers are merged"
      (let [expected mw.etag-cache/etag-headers-for-metabase-version]
        (doseq [[k v] expected]
          (is (= v (get hdrs k))))))))
