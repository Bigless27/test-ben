create something similar to Overview table at https://www.benzinga.com/profile/portfolio/ using the Benzinga data package (you will need to be logged in to see this). You don't need to make a complete copy simply the basics. The following is a required list of items to be in the website.

Requirements:

1. make the packages work using local file system instead of npm repo. (currently the package.json does not know how to find the 4 packages. figure out how to make nmp use the filesystem to find packages)
2. have a simple login (use can use any kind of UI framework for this, i don't care about this) (don't worry about social auth)
3. the ability to create/delete Watchlists.
3. the ability to add or remove a symbol to/from a Watchlist.
4. the ability to view info about a stock: name, price, change($), change(%), Volume, ...etc
5. use the data package provided to achieve this.
6. use react as a framework
7. use typescript as a language.
8. record a video demo

hints:

1. you will only be using three managers in the data package. The authentication, watchlist and quotes manager.
2. The readme in each package is very helpful as well.
3. ask for help if you are stuck =)