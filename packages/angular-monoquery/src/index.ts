import { Observable } from "rxjs/Observable";
import { fromPromise } from "rxjs/observable/fromPromise";
import { map, mergeAll } from "rxjs/operators";
import { createMonoQuery } from "monoquery";

export const Fragments = ({
  providerName = "monoProvider",
  fragments
}) => DecoratedComponent => {
  DecoratedComponent.fragments = fragments;
  Object.defineProperty(DecoratedComponent.prototype, "data", {
    get: function data() {
      return this[providerName]
        .getDataFor(DecoratedComponent)
        .pipe(map(x => JSON.stringify(x)));
    }
  });
  return DecoratedComponent;
};

export const MonoQuery = ({ fetcher, query, ...options }) => result => {
  result.prototype.fetchData = function fetchData() {
    this.monoQuery = this.monoQuery || createMonoQuery(fetcher);
    return (this.data = new Observable(observer => {
      observer.next(this.monoQuery({ ...options, query: query() }));
      observer.complete();
    }));
  };
  result.prototype.getDataFor = function getDataFor(comp) {
    return this.data.pipe(
      mergeAll(),
      map((d: any) => d.getResultsFor(comp.fragments))
    );
  };
  return result;
};

export { gql } from "monoquery";
