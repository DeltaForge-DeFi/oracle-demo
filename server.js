const express = require('express');
const app = express();
const aaveRoutes = require('./routes/aaveRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

app.use(express.json());
app.use('/aave', aaveRoutes);
app.use('/', calculatorRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
