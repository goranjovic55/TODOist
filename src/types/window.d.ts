interface Window {
  // Add custom properties to Window interface
  __REDUX_STORE__: any;
  
  // Fix property 'console' does not exist on type 'Window'
  console: Console;
  
  // Any other custom properties your app might add to the window object
  top: Window;
} 