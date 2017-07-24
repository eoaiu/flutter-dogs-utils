
const moment     = require('moment')
const f          = 'YYYY-MM-DD'

module.exports = {

	// console.log w/o trailing \n
	log(d){
		process.stdout.write(d)
	},

	/**
	 *	check if argument is numeric
	 *	return Bool
	 */
	isNum(n){
		return !isNaN(parseFloat(n)) && isFinite(n)
	},

	/**
	 *	calculate change of 2 values in %
	 *	returns change in % and 0 if either argument is not numeric or y == 0
	 *	@param Float, Float
	 *  @return Float
	 */
	change(x, y){
		if(this.isNum(x) && this.isNum(y))			
			return parseFloat(y != 0 ? (x - y) / (y / 100) : 0)
		return 0
	},

	/**
	 *	parses CSV file into 2-dim array
	 *  @param  String
	 *	@return Array or False
	 */
	parseCSV(csv, del){
		if(!csv) return false
		var a = csv.split('\n')
		var b = []
		a.forEach(row => row !== "" ? b.push(row.split(del)) : null)
		return b
	},

	/**
	 *  takes a Buffer and returns an array buffer
	 *  @param  Buffer
	 *  @return Uint8Array
	 */
	toArrayBuffer(buffer){
	    return buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
	},

	/**
	 *	takes an array buffer 
	 *  returns a node buffer 
	 *	@param Buffer
	 *  @return Uint8Array
	 */
	toBuffer(ab){
	    var buffer = Buffer.alloc(ab.byteLength)
	    var view   = new Uint8Array(ab)
	    for(let i = 0; i < buffer.length; ++i){
	        buffer[i] = view[i]
	    }
	    return buffer
	},

	/**
	 *	check file extension for common image formats
	 *	@param String, Array
	 *  @return Bool
	 */
	isImage(e, extensionList){
		const defaultList = ['jpg', 'jpeg', 'gif', 'bmp', 'png']
		var list = extensionList && extensionList.isArray() ? extensionList : defaultList
		return list.indexOf(e.toLowerCase()) != -1 ? true : false
	},

	// takes data array from database
	// returns summation index
	// this is a shitshow - rewrite so that it runs from back to front!
	// no startDate -> start at beginning
	/**
	 *
	 *
	 *
	 *
	 *
	 */
	sumIndex(data, startDate){	

		var that = this

		console.log('called sum index with:\n    user data:', data[0].dataByDate) //, '\n    feeds:', data[0].newsFeed)

		// to be called with news and rss
		function compileIndexData(data, startDate){
			var indexData = {}
			for(let date in data){
			    if(data.hasOwnProperty(date)){

			    	if(startDate && !moment(date).isAfter(startDate)) continue
			        
			        if(indexData[date]) indexData[date].push(data[date])
			        else                indexData[date] = [data[date]]
			        //console.log(indexData[date])
					
			    }
			}
			return indexData
		}

		// INDEX -> concated INDEX data
		function nextIndexRow(i, INDEX, resIndex){


			function change(x,y){return y != 0 ? (x - y) / (y / 100) : 0}
			function move(open, low, high){return Math.abs(change(low, open)) + Math.abs(change(high, open))}

			let indexRow = {
				date:      INDEX[longest][i].date,
				open:      0,
				close:     0,
				low:       0,
				high:      0,
				volume:    0,
				highP:     0,
				lowP:      0,
				closeP:    0,
				move:      0,
				change:    0
			}

			/**
				!!!!!!BUGS!!!!!
			*/
			// fang: 2004-08 - 2014-03 keine volumen??
			// -> müssten volumen von aapl sein
			// news funktionieren auch nicht...

			let rows = INDEX.map(SYM => SYM[i] ? SYM[i] : null)
			rows.forEach(r => {
				if(r){
					indexRow.open   += parseFloat(r.open)
					indexRow.high   += parseFloat(r.high)
					indexRow.low    += parseFloat(r.low)
					indexRow.close  += parseFloat(r.close)
					indexRow.volume += parseInt(r.volume)
				}
			})

			// do first entry automatically since while loop gets stuck on j = 0
			if(i == 0){

				// calculate close of i = 1 in advance
				let sndIndexRows = INDEX.map(SYM => SYM[i+1] ? SYM[i+1] : null)
				let sndRow = {close: 0}

				sndIndexRows.forEach(r => r ? sndRow.close += parseFloat(r.close) : null)
				indexRow.change = change(indexRow.close, sndRow.close).toFixed(3) 	

			}


			// find last close 
			var lastClose = 0
			var j = 1 //1
			while(resIndex[i-j]){
				if(resIndex[i-j] && resIndex[i-j].close){
					
					//if(i<10) console.log(`fang change: i:${i}, j:${j}, date: ${resIndex[i-j].date} lastClose:${resIndex[i-j].close}, close:${indexRow.close}`)
					
					if(i == 0)
						lastClose = resIndex[0].close
					else 
						lastClose = resIndex[i-j].close
					break
				}
				j++
			}

			if(i > 0)
				indexRow.change = change(indexRow.close, lastClose).toFixed(3)

			if(indexRow.close){
				// custom stats			
				indexRow.move      = move(indexRow.open, indexRow.high, indexRow.low).toFixed(3)
				indexRow.highP     = change(indexRow.open, indexRow.high).toFixed(3)
				indexRow.lowP      = change(indexRow.open, indexRow.low).toFixed(3)
				indexRow.closeP    = change(indexRow.open, indexRow.close).toFixed(3)

				// formatting
				indexRow.open   = indexRow.open.toFixed(3)
				indexRow.high   = indexRow.high.toFixed(3)
				indexRow.low    = indexRow.low.toFixed(3)
				indexRow.close  = indexRow.close.toFixed(3)

			} else {
				// non trade day
				indexRow = {
					date: INDEX[longest][i].date
				}
			}


			return indexRow
		}

		var INDEX = []
		var indexNews = {
			rss:  [],
			user: []
		}
		data.forEach(symData => {
			indexNews.rss.push(symData.newsFeed)
			indexNews.user.push(symData.dataByDate)
			INDEX.push(symData.data)	
		})

		// index feeds / user data
		// nothing ?!?!?!
		var indexFeeds = {}
		var indexUserData = {}
		indexNews.rss.forEach(rss   => Object.assign(indexFeeds, compileIndexData(rss)))
		indexNews.user.forEach(usrd => Object.assign(indexUserData, compileIndexData(usrd)))

		console.log('indexUserData:', indexUserData)

		const lengths = INDEX.map(e => e.length)
		const maxlen  = Math.max.apply(null, lengths)
		const longest = lengths.indexOf(Math.max.apply(Math, lengths))


		//console.log('startDate'.red, startDate)
		if(startDate)
			INDEX = INDEX.map(sym => 
				sym.filter(row => 
					moment(row.date).isAfter(startDate) ? true : false))	
		

		//DEBUGG FROM HERE 
		//console.log('debug form here', INDEX[0][0])

		// fill index data
		var index = []
		for(let i = 0; i < maxlen; i++){
			index.push(nextIndexRow(i, INDEX, index))
			//if(i < 10) console.log('in final index array', i, index[i].date, index[i].change)
		}

		console.log('done calculating index'.green)

		return {
			data:  index,
			feeds: indexFeeds,
			user:  indexUserData
		}

	},

	// use in completeDates
	googleDataWrapper(row){
		return {
			date:      row[0],
			open:      parseFloat(row[1]).toFixed(3),
			high:      parseFloat(row[2]).toFixed(3),
			low:       parseFloat(row[3]).toFixed(3),
			close:     parseFloat(row[4]).toFixed(3),
			volume:    row[5],
			highP:     this.change(row[2], row[1]).toFixed(3),
			lowP:      this.change(row[3], row[1]).toFixed(3),
			closeP:    this.change(row[4], row[1]).toFixed(3),
			change:    row[6].toFixed(3),
		}
	},


	// using [{}]
	// wrapping row array to object using dataWrapper()
	/**
	 *	takes a time series in form of an Array of Objects
	 *	inserts missing dates and returns 
	 *	@param  [[YYYY-MM-DD, ...]]
	 *  @return [{date, ...}]
	 */
	completeDates(data){

		var   result = []
		const currentDate = moment()
		
		// insert dates if they are missing, calculate change
		for(let i = 0; i < data.length; ++i){

			if(i + 1 in data){

				let today      = moment(data[i][0], f)
				let lastDay    = moment(data[i+1][0], f)

				// add change(difference low, high)
				let dataToPush = data[i].concat(this.change(data[i][4], data[i+1][4])) 
				
				// convert array to object
				dataToPush = this.googleDataWrapper(dataToPush)

				result.push(dataToPush)

				if(today.add(-1, 'day').format(f) != lastDay.format(f)){
					
					while(today.format(f) != lastDay.format(f)){

						let dataToPush = { date: today.format(f) }
						result.push(dataToPush)
						today.add(-1,'day')

					}

				}

			} else {
				// wrap row data as object
				let dataToPush = this.googleDataWrapper(data[i].concat(0))
				result.push(dataToPush)

			}

		}

		// prepend dates to today
		result.reverse()

		while(result[result.length-1].date != currentDate.format(f)){						
			let lastDate = result[result.length-1].date
			result.push({ date: moment(lastDate).add(1, 'day').format(f) })
		}

		return result.reverse()

	},

	/*
	 *	takes a 2-dim Array, returns concated elements as Array
	 *  @param  Array
	 *  @return Array
	 */
	multiArrConcat(arr){
		return arr instanceof Array ? [].concat.apply([], arr) : []
	}

}