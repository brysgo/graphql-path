import expect from "expect";
import graphqlPath from "src/index";

describe("graphqlPath", () => {
  it("returns a map of paths in a graphql query", () => {
    expect(graphqlPath`
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

      fragment Foo on Bar {
        blah
      }
    `).toEqual({
      somethingOnRoot: "",
      onSomeResource: "someResource",
      onAnotherField: "someResource.anotherField",
      Foo: "someResource.anotherField"
    });
  });
});
