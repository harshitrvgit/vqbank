class Paper {
	constructor(paperId) {
		this.paperId = paperId;
		this.purchasedPaper = {
			[paperId]: {
				ok: 'ok',
			},
		};
	}
}

const paper = new Paper('6379cd0fd445984cdd8e4d99');

console.log(paper);
