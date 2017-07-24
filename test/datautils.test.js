
const assert  = require('assert')
const utils = require('../src/DataUtils.js')
const generate = require('csv-generate')
const moment = require('moment')
const chai    = require('chai')
const should  = chai.should()
const expect  = chai.expect
chai.use(require('chai-things'))	// better assertion on array elements

const testUtils = require('../test-utils/data-utils.test-utils.js')
const timeSeriesGen = testUtils.timeSeriesGen


describe('utility functions', function() {

	describe('isNum()', function(){
		it('should check if argument is a number', function(){
			utils.isNum(1).should.equal(true)
			utils.isNum(Infinity).should.equal(false)
			utils.isNum('a').should.equal(false)
		})
	})

	describe('change()', function(){
		it('should calculate the change in %', function() {
			utils.change(1,0).should.equal(0)
			utils.change(2,1).should.equal(100)
		})
	})

	describe('parseCSV()', function(){
		it('should take a CSV file and return the data as 2dim array', function(){
			const opts = {
				seed: 1,
				columns: 4,
				length: 5
			}
			// check for row/column length equality
			generate(opts, (err, out) => {
				const parsed = utils.parseCSV(out)
				parsed.length.should.equal(opts.length)
				parsed.forEach(row => row.length.should.equal(opts.columns))
			})
		})
	})

	describe('toArrayBuffer', function() {
		it('should take a buffer and return an ArrayBuffer', function() {
			expect(utils.toArrayBuffer(Buffer.alloc(10))).to.be.an('uint8array')
		})
	})

	describe('toBuffer()', function() {
		it('should take a node buffer and return an Uint8Array', function() {
			expect(utils.toBuffer(new Uint8Array(10))).to.deep.equal(Buffer.alloc(10))
		})
	})

	describe('isImage()', function() {
		const fx = ['jpg', 'jpeg', 'gif', 'bmp', 'png']
		const res = fx.map(e => utils.isImage(e))
		it('should check if file is image from file extension', function() {
			res.should.all.equal(true)
		})
	})

	describe('completeDates()', function(){
		it('should take a 2-dim array time series, complete missing dates until today and wrap each row as an object', function(){

			var today = moment().format('YYYY-MM-DD')
			var startDate = moment().add(-7, 'day').format('YYYY-MM-DD')

			var gen = timeSeriesGen(startDate, 8)
			var data = []
			var d
			
			do {
				d = gen.next()
				if(d.value) 
					data.push(d.value)
			} while(!d.done)

			data.reverse()

			var formattedData = data.map(row => utils.googleDataWrapper(row))
									
			var incomplete = data.filter((e,i) => i%3 == 0 ? false : true)

			var completedData = utils.completeDates(incomplete)

			var formattedDates = formattedData.map(r => r.date)
			var completedDates = completedData.map(r => r.date)

			expect(completedDates).to.deep.equal(formattedDates)

		})
	})

	describe('multiArrConcat()', function(){
		it('should take a 2 dim array, concat all elements and return the array', function(){
			const arr = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
			expect(utils.multiArrConcat(arr)).to.deep.equal([1,2,3,4,5,6,7,8,9,10,11,12])
		})
	})

})