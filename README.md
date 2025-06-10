This project allows you to visualise a lower hemisphere stereonet in its standard 2D format as well as in 3D.

Planes and poles can be added to the stereonet and are displayed in both 2D and 3D views.

The aim of this project was to create a light weight and simple implementation which avoids the use of any javascript frameworks.
All rendering is done using THREE.js visualisation library.

To run in development:
    - Need Node version 18.17.0 to run, as well as yarn
    - 'Yarn' to install dependencies
    - 'Yarn dev' to run in development mode

To push changes to github pages:
    - 'Yarn predeploy' to build to dist folder (check this is done successfully)
    - 'Yarn deploy' deploys the built contents of dist folder to the github pages branch of the repo
