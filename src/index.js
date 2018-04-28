import { visit } from "graphql/language/visitor";
import parseGraphql from "graphql-tag";

export default (graphqlStrings, ...pathNames) => {
  const result = {
    fragmentPaths: {}
  };
  const fragmentNames = new Map();
  const prefix = "graphqlPathPrefix_";
  const unwrappedPathNames = [];
  const stringPathNames = pathNames.filter(pathName => {
    const isString = typeof pathName === "string";
    if (!isString && !!pathName) {
      const unwrappedPathName = pathName.parsedQuery || pathName;
      unwrappedPathNames.push(unwrappedPathName);
      visit(unwrappedPathName, {
        FragmentDefinition: {
          enter(node, key, parent, path, ancestors) {
            const fragmentName = node.name.value;
            fragmentNames.set(pathName, fragmentName);
          }
        }
      });
    } else if (!pathName) {
      throw new Error("Uh oh, your fragment was undefined!");
    } else {
      unwrappedPathNames.push(pathName);
    }
    return isString;
  });
  const prefixedNames = stringPathNames.map(pathName => prefix + pathName);
  const wholeQuery = String.raw(graphqlStrings, ...prefixedNames);
  const parsedQuery = parseGraphql([wholeQuery]);
  result.parsedQuery = parseGraphql(graphqlStrings, ...unwrappedPathNames);
  result.fragmentNames = fragmentNames;

  const convertToStringPath = path => {
    const res = [];
    path.reduce(
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
          result.fragmentPaths[
            fieldName.slice(prefix.length)
          ] = convertToStringPath(path).join(".");
        }
      }
    },
    FragmentSpread: {
      enter(node, key, parent, path, ancestors) {
        const fieldName = node.name.value;
        result.fragmentPaths[fieldName] = convertToStringPath(path).join(".");
      }
    }
  });

  return result;
};
