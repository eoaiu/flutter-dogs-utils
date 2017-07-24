
const moment = require('moment')
const Chance = require('chance')
const chance = new Chance()

module.exports = {
		
	/**
	 *	generator for random timeseries as [[]]
	 */
	timeSeriesGen: function* (start, length){
					
		var i = 0
		
		while(i < length){

			let date = moment(start).add(i++, 'd').format('YYYY-MM-DD')

			let data = {
				open: 	chance.floating({min: 1, max: 2, fixed: 3}),
				high: 	chance.floating({min: 1, max: 2, fixed: 3}),
				low: 	chance.floating({min: 1, max: 2, fixed: 3}),
				close: 	chance.floating({min: 1, max: 2, fixed: 3}),
				vol: 	chance.natural({min: 10000, max: 200000}),
				chg:    chance.floating({min: -7, max: 7})
			}

			let row = [date, data.open, data.high, data.low, data.close, data.vol, data.chg]
								
			yield row

		}
		
	}

}