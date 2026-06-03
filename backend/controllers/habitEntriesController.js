import { pool }
from "../database/db.js";

export async function createHabitEntry(req, res) {
    try {
        const { habit_id, date } = req.body;
        const userId = req.user.sub;

        if (!habit_id || !date) {
            return res.status(400).json({
                error: "Habit ID and date are required"
            });
        }

        const habit = await pool.query(
            `
            SELECT id
            FROM habits
            WHERE id = $1
              AND user_id = $2
            `,
            [habit_id, userId]
        );

        if (habit.rowCount === 0) {
            return res.status(404).json({
                error: "Habit not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO habit_entries
            (
                habit_id,
                date
            )
            VALUES ($1, $2)
            RETURNING *;
            `,
            [habit_id, date]
        );

        res.status(201).json({
            message: "Habit entry created",
            habitEntry: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export async function getHabitEntries(req, res) {
    try {
        const userId = req.user.sub;
        const result = await pool.query(`
                SELECT he.*
                FROM habit_entries he
                INNER JOIN habits h
                    ON h.id = he.habit_id
                WHERE h.user_id = $1;
            `, [userId]
        );
        res.status(200).json({
            message: "Habit entries retrieved",
            habitEntries: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export async function deleteHabitEntries(req, res) {
    try {
        const {id} = req.params;
        const userId = req.user.sub;

        const result = await pool.query(`
            DELETE FROM habit_entries he
                USING habits h
                WHERE he.habit_id = h.id
                AND he.id = $1
                AND h.user_id = $2;
            `, [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Habit entry not found"
            });
        }
        res.status(200).json({
            message: "Habit entry deleted",
            habitEntry: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}