const { createApp } = require('./app');
const { assertProductionConfig } = require('./sessionConfig');

assertProductionConfig();

require('./db');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
