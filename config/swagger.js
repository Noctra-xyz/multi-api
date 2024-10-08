const swaggerdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Multi-API',
			description: 'This API is designed to perform a variety of functions in order to assist users in creating or enhancing their commands and events.',
			version: '1.4.2',
		},
		tags: [
			{
				name: 'Discord',
				description: 'These require a Discord bot token which you can add using the Authorize button above.',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'apiKey',
					in: 'header',
					name: 'Authorization',
					description: 'Discord Bot Token',
					valuePrefix: '',
				},
			},
		},
		servers: [
			{
				url: 'https://api.v2.noctra.xyz',
				description: 'Main API URL',
			},
		],
	},
	apis: ['./endpoints/*.js'],
};

const specs = swaggerdoc(options);

module.exports = specs;
