from typing import Optional, TypeVar, Literal

from ..common import Color, StrictModel

Variant = Literal["title", "initialTitle"]

class Title(StrictModel):
    fg:      Optional[Color]   = None
    bg:      Optional[Color]   = None
    variant: Optional[Variant] = None
