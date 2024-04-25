# ShapeDiver App Builder SDK

This repository contains the code of the single page application (SPA) which serves as the frontend of [ShapeDiver App Builder](https://help.shapediver.com/doc/shapediver-app-builder). 

> [!NOTE] 
> You can find the latest deployed version of this code here: [https://appbuilder.shapediver.com/v1/main/latest/](https://appbuilder.shapediver.com/v1/main/latest/)
>
> Specific versions can be accessed by using this URL pattern: https://appbuilder.shapediver.com/v1/main/{VERSION}/ 
>
> Example: [https://appbuilder.shapediver.com/v1/main/0.3.0-beta.7/](https://appbuilder.shapediver.com/v1/main/0.3.0-beta.7/)

## What is App Builder ?

Read about ShapeDiver App Builder in our [help center](https://help.shapediver.com/doc/shapediver-app-builder). This repository contains the [App Builder Open-Source SDK](https://help.shapediver.com/doc/app-builder-open-source-sdk). Building this code results in the single page application that renders the skeleton consisting of containers, tabs, widgets, and elements as explained [here](https://help.shapediver.com/doc/build-apps-in-grasshopper). 

### Some pointers to the code

  * [App Builder React components](src/components/shapediver/appbuilder/) (containers, tabs, widgets)
  * [App Builder page templates](src/pages/templates/)
  * [Main App Builder page](src/pages/appbuilder/) (uses the template selector)
  * [Default theme](src/hooks/ui/useCustomTheme.ts)
  * [App Builder skeleton type definition](src/types/shapediver/appbuilder.ts)

Feel free to fork from this repository in case you want to develop and deploy your own flavour of the [App Builder](https://help.shapediver.com/doc/shapediver-app-builder) SPA. 

In case you want to extend App Builder by new widgets, these are your options: 

  * Fork this repository, extend the skeleton [type definition](src/types/shapediver/appbuilder.ts) by your new widgets, implement them. Then
    * build and deploy yourself, or
    * submit a pull request. 
  * Create an [issue](issues) and tell us about the widgets you would like to be included. 
  * Ask us on the [forum](https://forum.shapediver.com).

## What else can this codebase do for me ?

Apart from the App Builder functionality, this repository contains useful [React](https://react.dev/) components and hooks for using the [ShapeDiver 3D Viewer](https://help.shapediver.com/doc/viewer) and the [ShapeDiver Platform Backend](https://help.shapediver.com/doc/platform-backend). If you want to develop a web application using React and ShapeDiver, this is a great codebase to start from. 

In case you want to contribute to this repository, feel free to fork it and open pull requests. 


## Getting started

Install dependencies: 

```npm i```

Start local development server: 

```npm run start```

This runs the app in development mode. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in the browser. 
The page will re-render when you make edits. You will also see potential errors in the console. 

### Prerequisites

We recommend using an IDE like [Visual Studio Code](https://code.visualstudio.com/). 

Recommended extensions: 

  * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

The example works using [node.js](https://nodejs.dev/en/about/releases/) 18 and 20. 

### Further available scripts

```npm run build```

Builds the app for production to the `dist` folder.

### Developer tools

When developing using Chrome, the following browser extensions are useful: 

  * [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
  * [Redux DevTools](https://github.com/reduxjs/redux-devtools): allows to inspect the stores managed by [zustand](https://github.com/pmndrs/zustand)


### Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

This [playlist](https://www.youtube.com/playlist?list=PLm0xKijKIaNEbUmUXJK1h8PoI9gYqznwS) contains some valuable tutorials about React, TypeScript, and Mantine. 

  * [ShapeDiver Help Center](https://help.shapediver.com)
  * [ShapeDiver Forum](https://forum.shapediver.com)


## Some hints about ShapeDiver

The complete API documentation of the ShapeDiver 3D Viewer can be found [here](https://viewer.shapediver.com/v3/latest/api/index.html). 

This example includes some [tickets](https://help.shapediver.com/doc/enable-embedding) of ShapeDiver models for testing. 
You can [author](https://help.shapediver.com/doc/grasshopper) and [upload](https://help.shapediver.com/doc/uploading-models) your own Grasshopper models.  


## Dependencies and insights for developers

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

  * [useViewport](src/hooks/shapediver/viewer/useViewport.ts)
  * [useSession](src/hooks/shapediver/useSession.ts)
  * [useSessions](src/hooks/shapediver/useSessions.ts)

Related components: 

  * [ViewportComponent](src/components/shapediver/viewport/ViewportComponent.tsx) makes use of [useViewport](src/hooks/shapediver/viewer/useViewport.ts)
  * [ViewPage](src/pages/examples/ViewPage.tsx) creates a single session using [useSession](src/hooks/shapediver/useSession.ts) and uses a [ViewportComponent](src/components/shapediver/viewport/ViewportComponent.tsx)

#### Parameter and export store

This store provides a stateful abstraction of the parameter and export functionality offered by the ShapeDiver 3D Viewer. 

Interface: [IShapeDiverStoreParameters](src/types/store/shapediverStoreParameters.ts), 
Implementation: [useShapeDiverStoreParameters](src/store/useShapeDiverStoreParameters.ts)

Related hooks: 

  * [useSession](src/hooks/shapediver/useSession.ts)
  * [useSessions](src/hooks/shapediver/useSessions.ts)
  * [useDefineGenericParameters](src/hooks/shapediver/parameters/useDefineGenericParameters.ts)
  * [useSessionPropsParameter](src/hooks/shapediver/parameters/useSessionPropsParameter.ts)
  * [useSessionPropsExport](src/hooks/shapediver/parameters/useSessionPropsExport.ts)
  * [useParameter](src/hooks/shapediver/parameters/useParameter.ts)
  * [useExport](src/hooks/parameters/useExport.ts)
  * [useParameterComponentCommons](src/hooks/shapediver/parameters/useParameterComponentCommons.ts)
  * [useSortedParametersAndExports](src/hooks/shapediver/parameters/useSortedParametersAndExports.ts)

Related components: 
 
  * [Parameter components](src/components/shapediver/parameter) for the most common parameter types supported by ShapeDiver, uses [useParameterComponentCommons](src/hooks/shapediver/parameters/useParameterComponentCommons.ts)
  * [ExportButtonComponent](src/components/shapediver/exports/ExportButtonComponent.tsx) allows to trigger an export and makes use of [useExport](src/hooks/parameters/useExport.ts)
  * [ParametersAndExportsAccordionComponent](src/components/shapediver/ui/ParametersAndExportsAccordionComponent.tsx) implements an accordion of grouped parameter and export components


## Disclaimer

This code example is provided as is. We do not warrant it to be useful for any purpose.  
