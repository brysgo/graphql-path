import { visit } from "graphql/language/visitor";
import parseGraphql from "graphql-tag";

const prefix = "graphqlPathPrefix_";

function isValidGraphQLIdentifier(name) {
  // Regex taken from graphql-js
  const NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
  return NAME_RX.test(name);
}

function getFragmentNames(
  wrappedInterpolations,
  { andResolveRelativePaths: fragmentPaths }
) {
  const result = new Map();
  for (const wi of wrappedInterpolations) {
    if ("stringPlaceholder" in wi) continue;
    const transposedFragmentNames = {};
    (wi.fragmentNames || []).forEach(
      (v, k) => (transposedFragmentNames[v] = k)
    );
    const directFragmentDefinitions = [];
    const fromChildrenFragmentNames = [];
    visit(wi.parsedQuery, {
      FragmentDefinition: {
        enter(node, key, parent, path, ancestors) {
          const fragmentName = node.name.value;
          const childRef = transposedFragmentNames[fragmentName];
          if (childRef) {
            result.set(childRef, fragmentName);
            fragmentPaths[fragmentName] = wi.fragmentPaths[fragmentName];
            fromChildrenFragmentNames.push(fragmentName);
          } else {
            if (wi.directlyWrapped) {
              result.set(wi, fragmentName);
            } else {
              result.set(wi.parsedQuery, fragmentName);
            }
            directFragmentDefinitions.push(fragmentName);
          }
        }
      }
    });
    if (directFragmentDefinitions.length > 1) {
      throw new Error(`
        If you define more than one fragment in the same string, you will not
        be able to compose the fragment.

        This error may also be because you are composing fragments with
        "graphql-tag" instead of "graphql-path"
      `);
    }
    const [directFragmentName] = directFragmentDefinitions;
    for (const childFragmentName of fromChildrenFragmentNames) {
      fragmentPaths[childFragmentName] = [
        fragmentPaths[directFragmentName],
        fragmentPaths[childFragmentName]
      ]
        .filter(s => s !== "")
        .join(".");
    }
  }
  return result;
}

function wrap(interpolatable, options = {}) {
  const isString = typeof interpolatable === "string";
  if (isString && isValidGraphQLIdentifier(prefix + interpolatable)) {
    return {
      stringPlaceholder: interpolatable,
      ...options
    };
  } else {
    if (!interpolatable) {
      throw new Error("Uh oh, your fragment was undefined!");
    }
    if (isString) {
      interpolatable = parseGraphql([interpolatable]);
    }
    if (interpolatable.parsedQuery) {
      return interpolatable;
    } else {
      return {
        parsedQuery: interpolatable,
        ...options
      };
    }
  }
}

export default (graphqlStrings, ...interpolations) => {
  const wrappedInterpolations = interpolations.map(wrap);
  const unwrappedPathNames = [];
  const stringPathNames = interpolations.filter(
    i => typeof i === "string" && isValidGraphQLIdentifier(prefix + i)
  );
  const prefixedNames = stringPathNames.map(s => prefix + s);
  const queryWithTags = String.raw(graphqlStrings, ...prefixedNames);
  const parsedQueryWithPlaceholders = parseGraphql([queryWithTags]);
  const parsedQuery = parseGraphql(
    graphqlStrings,
    ...wrappedInterpolations.map(wi => wi.parsedQuery || wi.stringPlaceholder)
  );

  const convertToStringPath = path => {
    const res = [];
    path.reduce(
      (acc, p) => (acc.kind === "Field" && res.push(acc.name.value), acc[p]),
      parsedQueryWithPlaceholders
    );
    return res;
  };

  const fragmentPaths = {};
  visit(parsedQueryWithPlaceholders, {
    Field: {
      enter(node, key, parent, path, ancestors) {
        const fieldName = node.name.value;
        if (fieldName.indexOf(prefix) === 0) {
          fragmentPaths[fieldName.slice(prefix.length)] = convertToStringPath(
            path
          ).join(".");
        }
      }
    },
    FragmentSpread: {
      enter(node, key, parent, path, ancestors) {
        const fieldName = node.name.value;
        fragmentPaths[fieldName] = convertToStringPath(path).join(".");
      }
    }
  });
  const fragmentNames = getFragmentNames(wrappedInterpolations, {
    andResolveRelativePaths: fragmentPaths
  });
  return wrap(parsedQuery, {
    fragmentNames,
    fragmentPaths,
    directlyWrapped: true
  });
};
