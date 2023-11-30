# ShapeDiver React template

This project introduces some useful [React](https://react.dev/) components and hooks for using the [ShapeDiver 3D Viewer](https://help.shapediver.com/doc/viewer). 

> [!NOTE] 
> You can see a deployed version of this example [here](https://react-example.shapediver.com/prod/).

> [!WARNING]
> Work in progress, please expect frequent changes and refactoring!

## Some hints about ShapeDiver

The complete API documentation of the ShapeDiver 3D Viewer can be found [here](https://viewer.shapediver.com/v3/latest/api/index.html). 

This example includes some [tickets](https://help.shapediver.com/doc/enable-embedding) of ShapeDiver models for testing. 
You can [author](https://help.shapediver.com/doc/grasshopper) and [upload](https://help.shapediver.com/doc/uploading-models) your own Grasshopper models.  

You can insert tickets for your own models here: [src/tickets.ts](src/tickets.ts)

## Dependencies

### Basics

The example is coded using [TypeScript](https://www.typescriptlang.org/). We use [Vite](https://vitejs.dev/) as a build tool for 
fast development experience. 

### UI Kit

This template uses the [Mantine](https://mantine.dev/) UI Kit. However, the code has been developed having reusability in mind, which means 
it should easily be possible to swap out the UI Kit. 

### State management

We use the [zustand](https://github.com/pmndrs/zustand) state manager to provide the following stores: 

#### ShapeDiver session and viewport store

This store is used to manage [viewports](https://help.shapediver.com/doc/viewers) and [sessions](https://help.shapediver.com/doc/sessions) of the ShapeDiver 3D viewer. 

Interface: [IShapeDiverStoreViewer](src/types/store/shapediverStoreViewer.ts), 
Implementation: [useShapeDiverStoreViewer](src/store/useShapeDiverStoreViewer.ts)

Related hooks: 

  * [useViewport](src/hooks/useViewport.ts)
  * [useSession](src/hooks/useSession.ts)
  * [useSessions](src/hooks/useSessions.ts)

Related components: 

  * [ViewportComponent](src/components/shapediver/viewport/ViewportComponent.tsx) makes use of `useViewport`
  * [ViewPage](src/pages/ViewPage.tsx) creates a single session using `useSession` and uses a `ViewportComponent`

#### Parameter and export store

This store provides a stateful abstraction of the parameter and export functionality offered by the ShapeDiver 3D Viewer. 

Interface: [IShapeDiverStoreParameters](src/types/store/shapediverStoreParameters.ts), 
Implementation: [useShapeDiverStoreParameters](src/store/useShapeDiverStoreParameters.ts)

Related hooks: 

  * [useSession](src/hooks/useSession.ts)
  * [useSessions](src/hooks/useSessions.ts)
  * [useDefineGenericParameters](src/hooks/useDefineGenericParameters.ts)
  * [useSessionPropsParameter](src/hooks/useSessionPropsParameter.ts)
  * [useSessionPropsExport](src/hooks/useSessionPropsExport.ts)
  * [useParameter](src/hooks/useParameter.ts)
  * [useExport](src/hooks/useExport.ts)
  * [useParameterComponentCommons](src/hooks/useParameterComponentCommons.ts)
  * [useSortedParametersAndExports](src/hooks/useSortedParametersAndExports.ts)

Related components: 
 
  * [Parameter components](src/components/shapediver/parameter) for the most common parameter types supported by ShapeDiver, uses `useParameterComponentCommons`
  * [ExportButtonComponent](src/components/shapediver/exports/ExportButtonComponent.tsx) allows to trigger an export and makes use of `useExport`
  * [ParametersAndExportsAccordionComponent](src/components/shapediver/ui/ParametersAndExportsAccordionComponent.tsx) implements an accordion of grouped parameter and export components

## Prerequisites

We recommend using an IDE like [Visual Studio Code](https://code.visualstudio.com/). 

Recommended extensions: 

  * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

The example works using [node.js](https://nodejs.dev/en/about/releases/) 18 and 20. 

## Getting started

Install dependencies: 

```npm i```

Start local development server: 

```npm run start```

This runs the app in development mode. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in the browser. 
The page will re-render when you make edits. You will also see potential errors in the console. 

### Further available scripts

```npm run build```

Builds the app for production to the `dist` folder.

## Developer tools

When developing using Chrome, the following browser extensions are useful: 

  * [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
  * [Redux DevTools](https://github.com/reduxjs/redux-devtools): allows to inspect the stores managed by [zustand](https://github.com/pmndrs/zustand)


## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

This [playlist](https://www.youtube.com/playlist?list=PLm0xKijKIaNEbUmUXJK1h8PoI9gYqznwS) contains some valuable tutorials about React, TypeScript, and Mantine. 

  * [ShapeDiver Help Center](https://help.shapediver.com)
  * [ShapeDiver Forum](https://forum.shapediver.com)

## Disclaimer

This code example is provided as is. We do not warrant it to be useful for any purpose.  
