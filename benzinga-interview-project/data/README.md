# Data Package

The Data package is the go to place to get data from benzinga.

## Usage

To get started with the Data package you simply have to import `GetManager`

```ts
import { GetManager } from '@benzinga/data'
```

with `GetManager` you can ask for specific managers.

Each manager is responsible for managing the communication to one of our servers.

to get started you will fist need to use the `authentication` manager to simply login

```ts
const authManager = GetManager('authentication');
const login = await authManager.login('username', 'password');
if (login.err) {
  console.log(`Error: `, login.err);
} else {
	console.log(`Authentication: `, login.result);
}
```

As you can see from the example above the login function returns a `SafePromise`. A `SafePromise` simply handles catching the thrown error and returns an object that ether has a `err` or a `result`.

Some APIs work without logging in however most APIs require a login.

Once logged in you can use other mangers without any worry.

The Data package also has the concept of a feeds. a feed is a subscription based connection. The subscription will allow you subscribe to events as they come in.

Here is an example.

```ts
const authManager = GetManager('signals');
const feed = authManager.createFeed();
feed.setFilters([], ['NEW_HIGH', 'NEW_LOW']);
const subscription = feed.subscribe(event => {
  switch (event.type) {
    case 'signal':
      console.log(event.signal);
      break;
  }
})
feed.open();
setTimeout(() => subscription.unsubscribe(), 60000);
```

in this example we simply subscribe to signals coming from the signals feed for 1 min and then simply unsubscribe.

each manger has a `manager.ts` file this file list all the things you can do with this manager.
