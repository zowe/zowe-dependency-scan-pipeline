const rand = (low, high) => Math.random() * (high - low) + low;

function process() {
    const num = Math.trunc(rand(1, 100));
    console.log(`[{ "key": "Hello", "value":"${num}"}]`);
}

process();