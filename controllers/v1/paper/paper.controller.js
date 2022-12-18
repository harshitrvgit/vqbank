/**
 * Utils 
 */
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * Models
 */
const Paper = require("../../../models/paper.model.js");

/**
 * @description - This method renders the upload page.
 * 
 */
module.exports.renderUpload = (req, res) => {
    return res.render("vqbank/upload");
};

module.exports.uploadPaper = catchAsync(async (req, res) => {
    // Check if paper already exists
    const existingPaper = await Paper.findOne({
        originalname: req.file.originalname
    }); 

    if (existingPaper) {
        req.flash("error", "Paper already exists");
        return res.redirect("/api/v1/upload");
    }

    const paper = new Paper({
        ...req.file,
        user: req.user._id
    })

    await paper.save();

    return res.send("Paper uploaded");
});

/**
 * @description - Gets all the papers.
 */
module.exports.getAllPapers = catchAsync(async (req, res) => {
    const papers = await Paper.find({}).select("-__v -buffer");
    console.log("all papers", papers);
    return res.render("vqbank/index", {
        papers
    });
});