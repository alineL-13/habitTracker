import { pool }
from "../database/db.js";

export async function createHabit(req, res) {
    try {
        const {name, color} = req.body;
        const userId = req.user.sub;
        if(!name || !color) {
            return res.status(400).json({error: "Habit name and color are required"});
        }
        const result = await pool.query(`
                INSERT INTO habits
                (
                    name, color, user_id
                ) VALUES ($1, $2, $3) 
                 RETURNING *
            `,
            [name, color, userId]
        );
        res.status(201).json({
            message: "Habit created",
            habit:
            result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"})
    }
}

export async function getHabits(req, res) {
    try {
        const userId = req.user.sub;
        const result = await pool.query(`
                SELECT * FROM habits
                WHERE user_id = $1
            `,
            [userId]
        );
        res.status(200).json({
            message: "Habits retrieved",
            habits: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"})
    }
}

export async function updateHabit(req, res) { //PUT
    try{
        const userId = req.user.sub;
        const {id} = req.params;
        const {name, color} = req.body;

        if(!name || !color) {
            return res.status(400).json({error: "Habit name and color are required"});
        }
        
        const result = await pool.query(`
                UPDATE habits SET
                name = $1, color = $2
                WHERE id = $3 AND user_id = $4
                RETURNING *;
            `,
        [name, color, id, userId]);
        if(result.rowCount === 0) {
            return res.status(404).json({error: "Habit not found"});
        }
        res.status(200).json({
            message: "Habit updated",
            habit: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"});
    }
}

export async function deleteHabit(req, res) {
    try {
        const userId = req.user.sub;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM habits
            WHERE id = $1
              AND user_id = $2
            RETURNING *;
            `,
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Habit not found"
            });
        }

        res.status(200).json({
            message: "Habit deleted",
            habit: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}