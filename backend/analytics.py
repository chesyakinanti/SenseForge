from pymongo.collection import Collection


def build_equipment_pipeline(document_limit: int | None = None) -> list[dict]:
    pipeline = [{"$sort": {"reading_id": 1}}]
    if document_limit is not None:
        if document_limit < 1:
            raise ValueError("document_limit must be at least 1")
        pipeline.append({"$limit": document_limit})

    pipeline.extend(
        [
            {
                "$group": {
                    "_id": {
                        "equipment_id": "$equipment_id",
                        "operating_mode": "$operating_mode",
                    },
                    "readings": {"$sum": 1},
                    "anomalies": {"$sum": {"$cond": [{"$eq": ["$is_anomaly", 1]}, 1, 0]}},
                    "average_temperature_c": {"$avg": "$temperature_c"},
                    "average_vibration_mm_s": {"$avg": "$vibration_mm_s"},
                    "average_pressure_kpa": {"$avg": "$pressure_kpa"},
                    "average_motor_rpm": {"$avg": "$motor_rpm"},
                    "average_flow_rate_lpm": {"$avg": "$flow_rate_lpm"},
                }
            },
            {
                "$set": {
                    "anomaly_rate": {"$divide": ["$anomalies", "$readings"]},
                }
            },
            {"$sort": {"_id.equipment_id": 1, "_id.operating_mode": 1}},
        ]
    )
    return pipeline


def aggregate_equipment_summary(
    collection: Collection, document_limit: int | None = None
) -> list[dict]:
    return list(collection.aggregate(build_equipment_pipeline(document_limit)))