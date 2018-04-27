import expect from "expect";
import gql from "src/index";

describe("graphqlPath", () => {
  it("returns a map of paths in a graphql query", () => {
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
    expect(parsedQuery).toExist();
    expect(fragmentNames.get(fooFragment)).toEqual("Foo");
    expect(fragmentPaths).toEqual({
      somethingOnRoot: "",
      onSomeResource: "someResource",
      onAnotherField: "someResource.anotherField",
      Foo: "someResource.anotherField"
    });
  });
});
