# ShapeDiver App Builder SDK

This repository contains the code of the single page application (SPA) which serves as the frontend of [ShapeDiver App Builder](https://help.shapediver.com/doc/shapediver-app-builder). 

> [!NOTE] 
> You can find the latest deployed version of this code here:
>   * Anonymous access (used for embedding of App Builder): [https://appbuilder.shapediver.com/v1/main/latest/](https://appbuilder.shapediver.com/v1/main/latest/)
>   * In-platform access (requires you to be logged in on the ShapeDiver platform): [https://www.shapediver.com/app/builder/v1/main/latest/](https://www.shapediver.com/app/builder/v1/main/latest/)
>
> Click one of these links to see instructions on how to load your model.
> 
> Specific versions of the App Builder can be accessed by replacing `latest` with a version string.  
>
> Example:
>   * [https://appbuilder.shapediver.com/v1/main/1.5.0/](https://appbuilder.shapediver.com/v1/main/1.5.0/)

## What is App Builder ?

The App Builder features of the ShapeDiver plugin and platform allow users to create flexible, customizable single-page 3D web applications using only Grasshopper.
This repository contains the [App Builder Open-Source SDK](https://help.shapediver.com/doc/app-builder-open-source-sdk). Building this code results in the single page application that renders the skeleton consisting of containers, tabs, widgets, and elements as explained [here](https://help.shapediver.com/doc/build-apps-in-grasshopper). 
Read more about ShapeDiver App Builder in our [help center](https://help.shapediver.com/doc/shapediver-app-builder). 

Highlights of the open source App Builder SDK: 

  * Extensive support for styling using themes
  * Easy to be extended by further types of widgets etc
  * Great starting point for custom web apps using ShapeDiver and React

### Some hints about the code

#### App Builder React components
These [components](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/appbuilder/) are used to render the containers, tabs, widgets, and elements defined by the [skeleton](https://help.shapediver.com/doc/build-apps-in-grasshopper). 

#### App Builder page templates
So far we have implemented two [page templates](https://github.com/shapediver/AppBuilderShared/tree/development/pages/templates/). The template to be used can be configured using a property of the theme. 

  * `appshell` (default): 
    * This template is based on the [AppShell](https://mantine.dev/core/app-shell/) component of Mantine (the components library used by this codebase, read more about it below). 
    * The `appshell` template allows customization using the theme. 
    * Review the template code [here](https://github.com/shapediver/AppBuilderShared/tree/development/pages/templates/AppBuilderAppShellTemplatePage.tsx).
  
  * `grid`: 
    * A simple [grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) without responsiveness. 
    * This template allows customization using the theme.
    * Review the template code [here](https://github.com/shapediver/AppBuilderShared/tree/development/pages/templates/AppBuilderGridTemplatePage.tsx).
  
#### App Builder main page
The main page [component](https://github.com/shapediver/AppBuilderShared/tree/development/pages/appbuilder/AppBuilderPage.tsx) serves as the root of all App Builder pages. It does this: 

  * Uses some [custom hooks](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/appbuilder/) to resolve all the settings based on the [query string](https://en.wikipedia.org/wiki/Query_string). 
  * Opens a [session](https://help.shapediver.com/doc/sessions) with the ShapeDiver model to be used.
  * Gets the JSON content of the [data output](https://help.shapediver.com/doc/outputs-on-the-api#OutputsontheAPI-Dataoutputs) called _AppBuilder_. This content represents the _skeleton_.  
  * Instantiates App Builder React components based on the skeleton. 
  * Uses the template [selector](https://github.com/shapediver/AppBuilderShared/tree/development/pages/templates/AppBuilderTemplateSelector.tsx) to render the instantiated components using the selected page template.
  * You can find the TypeScript type definition of the skeleton and the settings [here](https://github.com/shapediver/AppBuilderShared/tree/development/types/shapediver/appbuilder.ts). There are also [validators](https://github.com/shapediver/AppBuilderShared/tree/development/types/shapediver/appbuildertypecheck.ts) for parsing these objects from JSON and validating them. 

### Themes

The [useCustomTheme](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/ui/useCustomTheme.ts) hook defines the default theme. Refer to the documentation of the [Mantine theme object](https://mantine.dev/theming/theme-object/) and the possibility to define [default props for Mantine components](https://mantine.dev/theming/default-props/) to understand what can be customized (basically everything). The App Builder components make use of Mantine's [useProps](https://mantine.dev/theming/default-props/#useprops-hook) hook to plug into the theme, which means the behavior and styling of the App Builder components can be controlled by the theme as well.

There is no need to fork and adapt the code to customize the theme. You can store the theme properties in a settings file in JSON format, and instruct the App Builder SPA to use the settings from this file using the `g` query string parameter. Some examples: 

  * Default theme: 
    * [https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4](https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4) 
    (notice that there is no `g` query string parameter)
  * Custom theme 1: 
    * [https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=theme01.json](https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=theme01.json)
    * [theme01.json](https://appbuilder.shapediver.com/v1/main/latest/theme01.json)
  * Custom theme 2: 
    * [https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=theme02.json](https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=theme02.json)
    * [theme02.json](https://appbuilder.shapediver.com/v1/main/latest/theme02.json)

Note that you can pass an absolute URL to the settings file when using the `g` query string parameter, i.e., you can host the settings file anywhere: [https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=https://appbuilder.shapediver.com/v1/main/latest/theme01.json](https://appbuilder.shapediver.com/v1/main/latest/?slug=240425-perforationswall-4&g=https://appbuilder.shapediver.com/v1/main/latest/theme02.json)

In a later release, we plan to implement a theme editor and to host the settings on the ShapeDiver platform. 

### How to reference models

The following query string parameters can be used to instruct the App Builder SPA which model to load: 

#### Option 1: `slug`

See the following link for instructions on how to use this: [https://www.shapediver.com/app/builder/v1/main/latest/](https://www.shapediver.com/app/builder/v1/main/latest/)

#### Option 2: `ticket` and `modelViewUrl`

See the following link for instructions on how to use this: [https://appbuilder.shapediver.com/v1/main/latest/](https://appbuilder.shapediver.com/v1/main/latest/)

#### Option 3: Referencing a settings file using `g`

You can use a settings file in JSON format to specify which model to load. This supports referencing the model using `slug` or using a `ticket` and `modelViewUrl`. The settings file can also include theme properties as explained above. Example: 

   * Settings file: [example02.json](https://appbuilder.shapediver.com/v1/main/latest/example02.json)
   * Using the settings file: [https://appbuilder.shapediver.com/v1/main/latest/?g=example02.json](https://appbuilder.shapediver.com/v1/main/latest/?g=example02.json)

As mentioned above, you can pass an absolute URL to the settings file when using the `g` query string parameter, i.e., you can host the settings file anywhere.
Note that the `slug` (or `ticket` and `modelViewUrl`) defined directly in the settings file take precedence over the query string parameters. 
 
### How to implement new widgets and contribute

Feel free to fork from this repository in case you want to develop and deploy your own flavour of the [App Builder](https://help.shapediver.com/doc/shapediver-app-builder) SPA. 

In case you want to extend App Builder by new widgets, these are your options: 

  * Option 1: 
    * Fork this repository, 
    * extend the skeleton [type definition](https://github.com/shapediver/AppBuilderShared/tree/development/types/shapediver/appbuilder.ts) and the [skeleton validator](https://github.com/shapediver/AppBuilderShared/tree/development/types/shapediver/appbuildertypecheck.ts) by your new widget properties (look for `IAppBuilderWidget`), and
    * implement them. 
    * Plug your new widgets into [AppBuilderWidgetsComponent](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/appbuilder/AppBuilderWidgetsComponent.tsx). Then
    * build and deploy yourself, or
    * submit a pull request to this repository. 
  * Option 2: Create an [issue](issues) and tell us about the widgets you would like to be included. 
  * Option 3: Ask us on the [forum](https://forum.shapediver.com).

## Getting started

Install dependencies: 

```pnpm i```

Start local development server: 

```pnpm start```

This runs the app in development mode. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in the browser. 
The page will re-render when you make edits. You will also see potential errors in the console. 

### Prerequisites

We recommend using an IDE like [Visual Studio Code](https://code.visualstudio.com/). 

Recommended extensions: 

  * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

The code works using [node.js](https://nodejs.dev/en/about/releases/) 18 and 20. 

### Further available scripts

```pnpm build```

Builds the app for production to the `dist` folder.

```pnpm run publish```

Publishes the app according to the branch that you are currently on:

- `task/XYZ`: If you are on a task branch, you can only deploy to that task number. Example: `task/SS-9999` deploys to `SS-9999`
- `development`: If you are on the `development` branch, the script will automatically deploy to that branch.
- `staging`: If you are on the `staging` branch, the script will automatically deploy to that branch.
- `master`: If you are on the `master` branch, you will receive a prompt that let's you choose where to deploy to.
  - `version`: here you can choose which part of the version you want to increase (`major`, `minor`, `patch`)
  - `latest`: If you choose this option, it will deploy to the `latest` tag.

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

## What else can this codebase do for me ?

Apart from the App Builder functionality, this repository contains useful [React](https://react.dev/) components and hooks for using the [ShapeDiver 3D Viewer](https://help.shapediver.com/doc/viewer) and the [ShapeDiver Platform Backend](https://help.shapediver.com/doc/platform-backend). If you want to develop a web application using React and ShapeDiver, this is a great codebase to start from. 

In case you want to contribute to this repository, feel free to fork it and open pull requests. 

## Dependencies and insights for developers

### Basics

This codebase is implemented using [TypeScript](https://www.typescriptlang.org/). We use [Vite](https://vitejs.dev/) as a build tool for 
fast development experience. 

### UI Kit

This codebase uses the [Mantine](https://mantine.dev/) UI Kit. However, the code has been developed having reusability in mind, which means it will easily be possible to swap out the UI Kit. 

### State management

We use the [zustand](https://github.com/pmndrs/zustand) state manager to provide the following stores: 

#### ShapeDiver session and viewport store

This store is used to manage [viewports](https://help.shapediver.com/doc/viewers) and [sessions](https://help.shapediver.com/doc/sessions) of the ShapeDiver 3D viewer. 

##### Session store

Interface: [IShapeDiverStoreSession](https://github.com/shapediver/AppBuilderShared/tree/development/types/store/shapeDiverStoreSession.ts), 
Implementation: [useShapeDiverStoreSession](https://github.com/shapediver/AppBuilderShared/tree/development/store/useShapeDiverStoreSession.ts)

##### Viewport store


Interface: [IShapeDiverStoreViewport](https://github.com/shapediver/AppBuilderShared/tree/development/types/store/shapeDiverStoreViewport.ts), 
Implementation: [useShapeDiverStoreViewport](https://github.com/shapediver/AppBuilderShared/tree/development/store/useShapeDiverStoreViewport.ts)

Related hooks: 

  * [useViewport](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/viewer/useViewport.ts)
  * [useSession](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/useSession.ts)
  * [useSessions](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/useSessions.ts)

Related components: 

  * [ViewportComponent](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/viewport/ViewportComponent.tsx) makes use of [useViewport](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/viewer/useViewport.ts)
  * [ViewPage](src/pages/examples/ViewPage.tsx) creates a single session using [useSession](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/useSession.ts) and uses a [ViewportComponent](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/viewport/ViewportComponent.tsx)

#### Parameter and export store

This store provides a stateful abstraction of the parameter and export functionality offered by the ShapeDiver 3D Viewer. 

Interface: [IShapeDiverStoreParameters](https://github.com/shapediver/AppBuilderShared/tree/development/types/store/shapediverStoreParameters.ts), 
Implementation: [useShapeDiverStoreParameters](https://github.com/shapediver/AppBuilderShared/tree/development/store/useShapeDiverStoreParameters.ts)

Related hooks: 

  * [useSession](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/useSession.ts)
  * [useSessions](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/useSessions.ts)
  * [useDefineGenericParameters](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useDefineGenericParameters.ts)
  * [useSessionPropsParameter](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useSessionPropsParameter.ts)
  * [useSessionPropsExport](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useSessionPropsExport.ts)
  * [useParameter](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useParameter.ts)
  * [useExport](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useExport.ts)
  * [useParameterComponentCommons](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useParameterComponentCommons.ts)
  * [useSortedParametersAndExports](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useSortedParametersAndExports.ts)
  * [useParameterChanges](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useParameterChanges.ts)
 
Related components: 
 
  * [Parameter components](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/parameter/) 
  Components for the most common parameter types supported by ShapeDiver, uses [useParameterComponentCommons](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useParameterComponentCommons.ts).
  * [ExportButtonComponent](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/exports/ExportButtonComponent.tsx) allows to trigger an export and makes use of [useExport](https://github.com/shapediver/AppBuilderShared/tree/development/hooks/shapediver/parameters/useExport.ts).
  * [ParametersAndExportsAccordionComponent](https://github.com/shapediver/AppBuilderShared/tree/development/components/shapediver/ui/ParametersAndExportsAccordionComponent.tsx) implements an accordion of grouped parameter and export components.


## Disclaimer

This code is provided as is. We do not warrant it to be useful for any purpose.  
