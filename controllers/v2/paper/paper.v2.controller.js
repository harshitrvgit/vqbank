/**
 * Utils 
 */
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * Models
 */
const Paper = require("../../../models/paper.model.js");

/**
 * @description - Uploads the paper to the database.
 */
module.exports.v2UploadPaper = catchAsync(async (req, res) => {
    // Check if paper already exists
    const existingPaper = await Paper.findOne({
        originalname: req.file.originalname
    });

    if (existingPaper) {
        return res.status(400).send({ message: "Paper already exists" });
    }

    const paper = new Paper({
        ...req.file,
        user: req.user._id
    })

    await paper.save();

    return res.status(201).send({ message: "Paper uploaded", paperId: paper._id });
});

/**
 * @description - Gets all the papers.
 */
module.exports.v2GetAllPapers = catchAsync(async (req, res) => {
    const papers = await Paper.find({}).select("-__v -buffer");
    console.log(papers);
    return res.status(200).send(papers);
});