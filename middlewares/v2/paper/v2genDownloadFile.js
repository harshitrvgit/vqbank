/**
 * Node modules.
 */
import fs from 'node:fs';
import { Readable } from 'node:stream';

/**
 * Model import.
 */
import Paper from '../../../models/paper.model.js';

/**
 * @description - This function reads the buffer data and generates the file.
 */
const v2GenDownloadFile = async (req, res, next) => {
	try {
		const { paperId } = req.query;

		// console.log(paperId);
		// return res.status(200).send({
		// 	message: paperId,
		// });

		if (!paperId)
			return res.status(404).send({
				message: 'required paper id',
			});

		const paper = await Paper.findById(paperId);
		const originalname = paper.originalname;

		if (!paper)
			return res.status(404).send({
				message: 'paper not found',
			});

		const paperExtension = paper.originalname.split('.').pop();
		const paperOriginalName = paper.originalname.split('.')[0];

		const paperData = paper.buffer;
		const readable = new Readable();
		readable.push(paperData);
		readable.push(null);

		if (!fs.existsSync('./uploads')) {
			fs.mkdirSync('./uploads');
		}

		if (!fs.existsSync(`./uploads/${paperOriginalName}.${paperExtension}`)) {
			const writeStream = fs.createWriteStream(
				`./uploads/${paperOriginalName}.${paperExtension}`
			);
			readable.pipe(writeStream);
		}

		const downloadPath = `./uploads/${paperOriginalName}.${paperExtension}`;

		return res.status(200).download(downloadPath, originalname);
	} catch (e) {
		return res.status(500).send({
			message: 'Internal server error',
		});
	}
};

export default v2GenDownloadFile;
