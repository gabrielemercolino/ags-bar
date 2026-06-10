from pydantic import BaseModel, ConfigDict

Color = str

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")
