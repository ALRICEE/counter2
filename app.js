const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(express.text());
app.use(cors());

let counters = {
    "g-": 102187,
    "s-": 6374
};

let receivedCounters = {
    "g-": [],
    "s-": []
};

let startCounters = { ...counters };
let getRequestCount = 0;

// Rewritten updateStartCounter function
function updateStartCounter(type) {
    // Step 1: Sort all receivedCounters[type] from highest to lowest number
    receivedCounters[type].sort((a, b) => b - a);

    // Step 2: Perform a while loop
while (receivedCounters[type].length > 0) {
    // Step 3: Check if startCounters[type] is in receivedCounters[type]
    const index = receivedCounters[type].indexOf(startCounters[type]);
    if (index !== -1) {
        // Step 4: Decrement the start counter
        startCounters[type]--;
        // Remove the element from the array
        receivedCounters[type].splice(index, 1);
    } else {
        // Exit the loop if the condition is not met
        break;
    }

    // Remove all elements greater than startCounters[type]
    receivedCounters[type] = receivedCounters[type].filter(counter => counter <= startCounters[type]);
}

}

function processQueue() {
	counters = { ...startCounters };
    updateStartCounter("g-");
    updateStartCounter("s-");
    counters = { ...startCounters }; // Reset counters to start from the first unreceived counter
}

setInterval(processQueue, 95000); // Process queue every 1 minute

app.get('/', (req, res) => {
    let response;
    
    while (counters["g-"] > 0) {
        if (!receivedCounters["g-"].includes(counters["g-"])) {
            response = `g-${counters["g-"]--}`;
            break;
        }
        counters["g-"]--;
    }
    
    if (!response) {
        while (counters["s-"] > 0) {
            if (!receivedCounters["s-"].includes(counters["s-"])) {
                response = `s-${counters["s-"]--}`;
                break;
            }
            counters["s-"]--;
        }
    }
    
    if (!response) {
        return res.status(400).send("all done");
    }
	/*
    getRequestCount++;
    if (getRequestCount >= 10) {
        processQueue();
        getRequestCount = 0;
    }*/

    res.send(response);
    console.log(startCounters);
    console.log(receivedCounters);
});

app.post('/', (req, res) => {
    const counter = req.body; // This will now be a string
    const [type, value] = counter.split('-');
    
    if ((type === 'g' || type === 's') && !isNaN(Number(value))) {
        receivedCounters[`${type}-`].push(Number(value));
        res.send("Counter received");
    } else {
        res.status(400).send("Invalid counter format");
    }
});

app.listen(port, () => {
  console.log(`Counter app listening at http://localhost:${port}`);
});
