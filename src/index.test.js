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
});
