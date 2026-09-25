# SWE-Project-SAR

9/24
I created a services and components folder within src so that everythign was more organized and scalable.

components/IdeaForm.jsx: Contains the form used to add new ideas or edit existing ideas. It manages the title and description input fields and sends the completed form data back to the Ideas page.

components/IdeasTable.jsx: Displays the current ideas in a table. Each idea contains Edit and Delete buttons that call functions provided by the Ideas page.

The components folder contains reusable interface elements. Keeping these components separate prevents the main Ideas page from becoming too large and makes them easier to modify or reuse.

Frontend Services
services/ideasApi.js: Contains all frontend requests to the Express backend, including the GET, POST, PUT, and DELETE requests for ideas.

The services folder separates backend communication from the visual React components. If the backend URL or API implementation changes later, it can be updated in one location.

Frontend Pages Revamp Guide

Ideas.jsx: Coordinates the Ideas page. It loads ideas from the backend, stores them in React state, and connects the idea form and table to the API functions.
Login.jsx: Displays the username and password form. The current login page provides navigation to the Ideas page, while actual account authentication will be added later.
Profile.jsx: Displays the user account page. Additional account information and functionality can be added as authentication is developed.
MyApp.jsx: Defines the application routes and shared page layout. It controls navigation between the Login, Ideas, and Profile pages.
main.jsx: Starts the React application and provides BrowserRouter, which enables navigation between pages.
main.css: Contains global styling and basic browser layout resets.
pages.css: Contains styling for the login page, sidebar, ideas form, ideas table, and profile page. Color variables are defined at the top of this file so the application theme can be changed from one location.
