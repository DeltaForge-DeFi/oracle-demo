import express from 'express';
import aaveRoutes from './routes/aaveRoutes.js';
import calculatorRoutes from './routes/calculatorRoutes.js';
import cors from "cors";

const app = express();

app.use(cors())

app.use(express.json());
app.use('/aave', aaveRoutes);
app.use('/', calculatorRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
