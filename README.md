# graphql-path

![CI](https://github.com/brysgo/graphql-path/workflows/CI/badge.svg)
[![npm package][npm-badge]][npm]

[build-badge]: https://circleci.com/gh/brysgo/graphql-path.svg?style=svg
[build]: https://circleci.com/gh/brysgo/graphql-path

[npm-badge]: https://img.shields.io/npm/v/graphql-path.png?style=flat-square
[npm]: https://www.npmjs.org/package/graphql-path

## What is this for?

Good question. GraphQL Path answers the question, "Where in this query am I spreading this fragment?"

## Why is this useful?

If I want to spread a fragment on a part of a query or another fragment, graphql knows how to get the extra data needed, but how do I know who to give the data to?

With frameworks like RelayJS, you just pass the props down to the component that requested the data.

MonoQuery takes a different approach, looking up the data by the fragment instead. GraphQL Path is how it knows where in the query to get that data.

## Usage

> `yarn add graphql-path`

```javascript
import gql from 'graphql-path';

const profileFragment = gql`
  fragment Profile on User {
    name
  }
`;
const { fragmentNames, fragmentPaths } = gql` 
    query TodoApp {
      todos {
        id
        text
        completed
        author {
          ...Profile
        }
      }
    }
  `

```
`fragmentNames` are a map. They map a graphql fragment document reference to the fragments name.
```javascript
> fragmentNames.get(profileFragment);
"Profile"
```
`fragmentPaths` are a plain old javascript object that you use to find out where a fragment is spread in the query when you know the name of the fragment.

```javascript
> fragmentPaths["Profile"]);
"todos.author"
```

GraphQL Path can also be a drop in replacement for `graphql-tag`.

```javascript
import gql from 'graphql-path';

client.query({
  query: gql`
    query TodoApp {
      todos {
        id
        text
        completed
      }
    }
  `,
})
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

But since we shamelessly polute their namespace, you can always get a clean version of their AST by using the `parsedQuery`...

```javascript
import gql from 'graphql-path';

client.query({
  query: (gql`
    query TodoApp {
      todos {
        id
        text
        completed
      }
    }
  `).parsedQuery,
})
  .then(data => console.log(data))
  .catch(error => console.error(error));
```
