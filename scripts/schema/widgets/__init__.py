from typing import Optional

from ..common import StrictModel
from .time import Time

class Widgets(StrictModel):
    time: Optional[Time] = None
