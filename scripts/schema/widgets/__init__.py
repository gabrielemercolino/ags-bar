from typing import Optional

from ..common import StrictModel
from .time import Time
from .title import Title

class Widgets(StrictModel):
    title: Optional[Title] = None
    time: Optional[Time] = None
