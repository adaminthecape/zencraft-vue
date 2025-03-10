## Making a new NPM module
Step 0: In general, follow the guide here:
https://pauloe-me.medium.com/typescript-npm-package-publishing-a-beginners-guide-40b95908e69c

Now, following from that, here's how I prefer it:

## Basic steps
Create a new folder, named according to what you want to call your project.

Open a terminal in that folder, and run `npm init`.

Enter your config as desired.

Install some basic packages:
`npm install typescript ts-node vitest rimraf tsup`

Don't install them as dev dependencies, or you might have problems building other packages when importing them.

In your `package.json`, ensure you export the correct paths AND types:
```
"main": "./dist/index.js",
"module": "./dist/index.mjs",
"types": "./dist/index.d.ts",
"files": [
  "dist"
],
```

Create a `src` folder in your root directory. Add an `index.ts` file and export your package via that.

Don't forget to make a `.gitignore` and add your `.env`, `node_modules`, and `dist`.

## Building your module
I've suggested using `tsup` above because it makes building much easier.

As in the guide, add `tsup.config.ts` in your root directory with this code:
```
// <tsup.config.ts>
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
});
```

You will need to also ensure you have a `tsconfig.json` file, which you will have created with `npx tsc --init` earlier.

Ensure that your `build` script cleans the `dist` folder as needed:
```
// <package.json>
"scripts": {
  "build": "rimraf ./dist && tsup"
},
```

## Testing your module
The guide says to use Jest, but I've had many problems with it, so I use vitest.

It's basically the same functions as Jest provides but easier to configure.

## Using your module
You can install your module in another Node project with: `npm install ../my-external-module`

You will of course need to rebuild it if you've changed something.