from .common import StrictModel

class Bar(StrictModel):
    left:   list[str] = []
    center: list[str] = []
    right:  list[str] = []
