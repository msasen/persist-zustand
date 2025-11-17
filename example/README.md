# persist-zustand Example

This folder contains a React example demonstrating the usage of the `persist-zustand` package.

## Installation

```bash
npm install
```

## Running

```bash
npm run dev
```

## Description

This example demonstrates the core features of the `persist-zustand` package:

- **URL Storage**: Counter 2 value is stored in the URL and can be managed with browser back/forward buttons
- **localStorage**: Counter 4 value is stored in localStorage
- **Priority Order**: Priority order can be set for different storage types

You can see how the `createPersistStore` function is used in the `src/stores.ts` file.

