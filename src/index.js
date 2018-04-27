import { visit } from "graphql/language/visitor";
import gql from "graphql-tag";

export default (graphqlStrings, ...pathNames) => {
  const result = {};
  const prefix = "graphqlPathPrefix_";
  const prefixedNames = pathNames.map(pathName => prefix + pathName);
  const wholeQuery = String.raw(graphqlStrings, ...prefixedNames);
  const parsedQuery = gql([wholeQuery]);

  const convertToStringPath = graphqlPath => {
    const res = [];
    graphqlPath.reduce(
      (acc, p) => (acc.kind === "Field" && res.push(acc.name.value), acc[p]),
      parsedQuery
    );
    return res;
  };

  visit(parsedQuery, {
    Field: {
      enter(node, key, parent, path, ancestors) {
        const fieldName = node.name.value;
        if (fieldName.indexOf(prefix) === 0) {
          result[fieldName.slice(prefix.length)] = convertToStringPath(
            path
          ).join(".");
        }
      }
    },
    FragmentSpread: {
      enter(node, key, parent, path, ancestors) {
        const fieldName = node.name.value;
        result[fieldName] = convertToStringPath(path).join(".");
      }
    }
  });

  return result;
};
