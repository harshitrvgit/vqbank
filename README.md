<h1 style="text-align: center;">vqBank </h1> 

<div style="display: flex; justify-content: center;"> 
    <img style="margin-right: 1em;" alt="Discord" src="https://img.shields.io/discord/764030364611117056">
    <img style="margin-right: 1em; alt="Uptime Robot status" src="https://img.shields.io/uptimerobot/status/m795122959-46f8db1b0389c3351a0b6cb3">
    <img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/hrv_vishwakarma">

</div>

<p style="margin-top: 1em;">Collections of all the examination papers of VIT University, Vellore</p>

[Click here](https://vqbank.onrender.com/) to visit the site.

## Setting up the app locally.

### Prerequisites

- NodeJS v16.x
- MongoDB v5.x  [Windows](https://medium.com/@LondonAppBrewery/how-to-download-install-mongodb-on-windows-4ee4b3493514) | [Mac](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)
- MongoDB Compass(optional)

1. Install dependencies:
```sh
npm install
```
2. Create a ```dev.env``` file in the ```env``` folder root of the project 
```sh
mkdir env
touch env/dev.env
```
-  with the following content:
```sh
PORT=3000
JWT_SECRET=<JWT_SECRET_OF_YOUR_CHOICE>
JWT_EXP=1d
MONGODB_URI=mongodb://localhost:27017/vqbank
SIGN_COOKIE=<SIGN_COOKIE_OF_YOUR_CHOICE>
```
3. Make sure your mongoDB is running and accessible from your local machine.

4. Finally start the app
```sh
npm run dev
```

## Contributing

- Read the [Code of Conduct](./docs/code-of-conduct.md) first.
- Contibuting [guidelines](./docs/contributing/contributing.md)

## License

[MIT](./LICENSE)
