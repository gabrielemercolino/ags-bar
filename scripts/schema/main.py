import json
from typing import Optional

from .common import StrictModel
from .colors import Colors
from .bar import Bar
from .widgets import Widgets

class Config(StrictModel):
    colors:  Optional[Colors] = None
    bar:     Optional[Bar] = None
    widgets: Optional[Widgets] = None

schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    **Config.model_json_schema()
}
print(json.dumps(schema, indent=2))
