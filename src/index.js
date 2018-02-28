import graphql from "graphql-anywhere";
import gql from "graphql-tag";

export default (graphqlStrings, ...pathNames) => {
  const result = {};
  const prefix = "graphqlPathPrefix_";
  const prefixedNames = pathNames.map(pathName => prefix + pathName);
  const wholeQuery = String.raw(graphqlStrings, ...prefixedNames);
  const parsedQuery = gql([wholeQuery]);

  graphql(
    (fieldName, rootValue, args, context) => {
      if (fieldName.indexOf(prefix) === 0) {
        result[fieldName.slice(prefix.length)] = rootValue.path.join(".");
      }
      return { path: [...rootValue.path, fieldName] };
    },
    parsedQuery,
    { path: [] }
  );

  return result;
};
