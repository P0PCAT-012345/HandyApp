# Handy AI

Handy AI is a proof-of-concept app created to demonstrate model described by "prototypical-DTW for few shot classification of sign language". New signs can be added, which can be identified in real-time without having to train any further.

## Installation

Install all node modules and python packages while inside the project directory.
```bash
yarn
pip install server/requirements.txt
```

## Usage
Run the python server. It will be hosted in localhost: 8765.

You should see "Server Started Successfully" message shortly after.
```bash
python server/server.py
```
Then run the web app. It will be hosted in localhost:3000
```bash
yarn start
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)