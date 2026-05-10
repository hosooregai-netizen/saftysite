from typing import Generic, TypeVar


TModel = TypeVar("TModel")


class InMemoryRepository(Generic[TModel]):
    """Small reusable repository for the bootstrap phase."""

    def __init__(self, items: list[TModel] | None = None) -> None:
        self._items = items or []

    def all(self) -> list[TModel]:
        return list(self._items)

    def add(self, item: TModel) -> TModel:
        self._items.append(item)
        return item
