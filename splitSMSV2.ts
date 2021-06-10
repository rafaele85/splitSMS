
const SMSLENGTH = 140


export const splitSMS2 = (text: string|null|undefined) => {
    if (!text) {                                                          // if text is blank return 0
        return []
    }
    if (text.length <= SMSLENGTH) {                                       // if entire text fits into one sms , return 1
        return [text]
    }
    const chars = text.length
    let nChunksEstimate = Math.ceil(chars / SMSLENGTH)                  // + number of k/n pieces inserted into the text


    const words = ['']
    // split text into words including spaces between them
    for(let i=0; i<text.length; i++) {
        const c = text[i]
        if (c!==' ') {
            words[words.length-1] += c
            continue
        }
        words.push(' ')
        if (i < text.length - 1) {
            words.push('')
        }
    }

    // accumulate pieces of message
    let messages = []

    // iterate through number of sms chunks, starting from minimal estimated number
    for(let nPlannedChunks = nChunksEstimate; ; nPlannedChunks++) {
        let chunksLen = ('' + nPlannedChunks).length   // length of planned number of chunks

        messages = ['']     // for every new number of chunks we start from the beginning
        let cont = false    // indicates if we need to try one more number of chunks or we are done

        // iterate over sms words
        for(let i=0; i<words.length; i++) {
            const chunkNo = messages.length                      // current chunk number
            const suffix = ` ${chunkNo}/${nPlannedChunks}`       // current suffix
            const suffixLen = suffix.length                      // length of current suffix
            const availableChars = SMSLENGTH - suffixLen         // available capacity of current chunk = 140 - length of current suffix
            const consumed = messages[messages.length-1].length  // how much chars we consumed so far out of capacity of current chunk
            const remainingChars = availableChars - consumed     // how much space is remaining in current chunk

            let w = words[i]

            if (w.length > remainingChars) {                           // if current word exceeds remaining space
                if (w === ' ') {                                       // if space at the end of the message, skip it
                    continue
                }
                messages.push(w)                                       // push current word to new chunk
                const nActualChunks = messages.length
                if (nActualChunks > nPlannedChunks) {                  // if actual number of chunks exceeds the planned
                    nPlannedChunks++                                   // increment planned number of chunks
                    const newChunksLen = ('' + nActualChunks).length   // calculate new length of actual number of chunks
                    if (newChunksLen > chunksLen) {                    // if new length exceeds the length of planned number of chunks
                        cont = true                                    // then we need ot allocate more space for suffix and repeat the process
                        break                                          // break out of for inner loop and continue to next iteration over outer for
                    }                                                  // if new length is the same, continue with inner loop and add words to new chunk
                }                                                      // if number of actual chunks does not exceed planned, continue with new chunk
            } else {
                messages[messages.length-1] += w                       // if there is still room for current word, add it to current chunk
            }
        }
        if (!cont) {                                                   // break once we figured out sufficient number of chunks and consumed all words
            break
        }
    }

    // add suffixes to each chunk
    for(let i=0; i<messages.length; i++) {
       if (!messages[i].endsWith(' ')) {   // if message does not already end with ' ', add suffix with a leading space
           messages[i] += ' '
       }
       messages[i] += `${i+1}/${messages.length}`
       if (messages[i].length > SMSLENGTH) {
           throw 'Exceeds '+SMSLENGTH
       }
    }
    return messages
}

/*
Algo complexity: main loop over words is of O(N), where N is text length
In the worst case if we are way off on initial estimate nChunksEstimate we will have to repeat the main loop LOG10(n) times
where n is number of chunks
Because max number of chunks will is set to be 9999, the time complexity is still O(N)
Memory complexiy is O(N)
*/


const runTests = () => {
    testEmpty('It should return empty array for null text', null)
    testEmpty('It should return empty array for undefined text', undefined)
    testEmpty('It should return empty array for blank text', '')

    let text = 'short message'
    testShort('Short message < 140 chars should be sent in one piece and should not include counters', text)

    text = 'Lorem ipsum dolor sit amet consectetur adipiscing elit Nullam eleifend odio at magna pretium suscipit Nam commodo mauris felis ut suscipit velit efficitur eget Sed sit amet posuere risus'
    testLength140( 'Every part of the message in the result should not exceed 140 characters', text)
    testMatch('Split message should not be different from the original text', text)
    testCounters('Multi-piece message should include sequential counters', text)

    const expected = ['Lorem ipsum dolor sit amet consectetur adipiscing elit Nullam eleifend odio at magna pretium suscipit Nam commodo mauris felis ut 1/2',
        'suscipit velit efficitur eget Sed sit amet posuere risus 2/2'
    ]

    testEquals('Split message should match the expected result ', text, expected)

    const withTrailingSpace = 'Lorem ipsum dolor sit amet consectetur adipiscing elit Nullam eleifend odio at magna pretium suscipit Nam commodo mauris felis ut suscipit velit efficitur eget Sed sit amet posuere risus '
    testLength140( 'With trailing space: Every part of the message in the result should not exceed 140 characters', withTrailingSpace)
    testMatch('With trailing space: Split message should not be different from the original text', withTrailingSpace)
    testCounters('With trailing space: Multi-piece message should include sequential counters', withTrailingSpace)

    const reallyLongMessage = withTrailingSpace.repeat(50)+' end'
    testLength140( 'Really long message: every part of the message in the result should not exceed 140 characters', reallyLongMessage)
    testMatch('Really long message: split message should not be different from the original text', reallyLongMessage)
    testCounters('Really long message: multi-piece message should include sequential counters', reallyLongMessage)

}



const removeCounts = (chunks: string[]) => {
    if(!chunks) {
        return chunks
    }
    return chunks.map((chunk, index) => {
        const counts = ` ${index+1}/${chunks.length}`
        if (chunk.endsWith(counts)) {
            return chunk.replace(counts, '')
        }
        return chunk
    })
}

const testEmpty = (testName: string, text: string|null|undefined) => {
    const result = splitSMS2(text)
    if (!result || result.length > 0) {
        console.error(testName, 'FAIL')
        console.error(result)
        return
    }
    console.log(testName + ' PASS')
}

const testLength140 = (testName: string, text: string) => {
    const result = splitSMS2(text)
    if (result && result.length > 0) {
        for(let r of result) {
            if (r.length > 140) {
                console.error(testName + ' FAIL')
                console.error(result)
                console.error(r)
                return
            }
        }
    }
    console.log(testName + ' PASS')
}

const testMatch = (testName: string, text: string) => {
    const result = splitSMS2(text)
    if(result) {
        const chunksWithNoCounts = removeCounts(result)
        const restored = chunksWithNoCounts.join(' ')
        if (restored !== text) {
            console.error(testName+' FAIL')
            console.error(result)
            console.error(`[${restored}]`)
            console.error(restored.length)
            return
        }
    }
    console.log(testName + ' PASS')
}



const testEquals = (testName: string, text: string, expected: string[]) => {
    const result = splitSMS2(text)
    console.log(result)
    if(result) {
        if (result.length !== expected.length) {
            console.error('FAIL: result length does not match expected length')
            return
        }
        for (let i=0; i<result.length; i++) {
            if (result[i] !== expected[i]) {
                console.error('FAIL: result does not match expected at ', i)
                return
            }
        }
    }
    console.log(testName + ' PASS')
}




const testShort = (testName: string, text: string) => {
    const result = splitSMS2(text)
    if (result && result.length > 0) {
        if (result.length !== 1 || result[0] !== text) {
            console.error(testName+' FAIL')
            console.error(result)
            return
        }
    }
    console.log(testName + ' PASS')
}

const testCounters = (testName: string, text: string) => {
    const result = splitSMS2(text)
    if (result && result.length > 0) {
        for(let i=0; i<result.length; i++) {
            const chunk = result[i]
            const counts = ` ${i+1}/${result.length}`
            if (!chunk.endsWith(counts)) {
                console.error(testName+' FAIL')
                console.error(chunk)
                console.error(counts)
                console.error(result)
                return
            }
        }
    }
    console.log(testName + ' PASS')
}


runTests()


