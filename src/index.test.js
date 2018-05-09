import gql from "./";
import { print } from "graphql/language";

describe("graphqlPath", () => {
  it("returns a map of paths in a graphql query", () => {
    const fooFragment = gql`
      fragment Foo on Bar {
        blah
      }
    `;
    const { parsedQuery, fragmentNames, fragmentPaths } = gql`
      query FooQuery {
        ${"somethingOnRoot"}
        someResource {
          ${"onSomeResource"}
          anotherField {
            ${"onAnotherField"}
            ...Foo
          }
        }
      }

      ${fooFragment}
    `;
    expect(print(parsedQuery)).toMatchSnapshot();
    expect(fragmentNames.get(fooFragment)).toEqual("Foo");
    expect(fragmentPaths).toEqual({
      somethingOnRoot: "",
      onSomeResource: "someResource",
      onAnotherField: "someResource.anotherField",
      Foo: "someResource.anotherField"
    });
  });

  it("also supports graphql tag result for fragments", () => {
    const { parsedQuery: fooFragment } = gql`
      fragment Foo on Bar {
        blah
      }
    `;
    const { parsedQuery, fragmentNames, fragmentPaths } = gql`
      query FooQuery {
        ${"somethingOnRoot"}
        someResource {
          ${"onSomeResource"}
          anotherField {
            ${"onAnotherField"}
            ...Foo
          }
        }
      }

      ${fooFragment}
    `;
    expect(print(parsedQuery)).toMatchSnapshot();
    expect(fragmentNames.get(fooFragment)).toEqual("Foo");
    expect(fragmentPaths).toEqual({
      somethingOnRoot: "",
      onSomeResource: "someResource",
      onAnotherField: "someResource.anotherField",
      Foo: "someResource.anotherField"
    });
  });

  it("doesn't try to get the path of invalid strings", () => {
    const unparsedFragment = `
      fragment UnparsedFragment on Query {
        hello
      }
    `;
    const { parsedQuery, fragmentNames, fragmentPaths } = gql`
      query FooQuery {
        ...UndefinedFragment
      }
      ${unparsedFragment}
    `;
    expect(print(parsedQuery)).toMatchSnapshot();
    expect(fragmentNames.get(unparsedFragment)).toEqual();
    expect(fragmentPaths).toEqual({
      UndefinedFragment: ""
    });
  });

  it("works with nested fragments", () => {
    const subChildFragment = gql`
      fragment SubChild on Child {
        blah
      }
    `;
    const childFragment = gql`
      fragment Child on Base {
        anotherField {
          ...SubChild
        }
      }
      ${subChildFragment}
    `;
    const baseFragment = gql`
      fragment Base on Query {
        someResource {
          ...Child
        }
      }
      ${childFragment}
    `;
    const { parsedQuery, fragmentNames, fragmentPaths } = gql`
      query FooQuery {
        ...Base
      }
      ${baseFragment}
    `;
    expect(print(parsedQuery)).toMatchSnapshot();
    expect(fragmentNames.get(baseFragment)).toEqual("Base");
    expect(fragmentNames.get(childFragment)).toEqual("Child");
    expect(fragmentNames.get(subChildFragment)).toEqual("SubChild");
    expect(fragmentPaths).toEqual({
      Base: "",
      Child: "someResource",
      SubChild: "someResource.anotherField"
    });
  });
});
