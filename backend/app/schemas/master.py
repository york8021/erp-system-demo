from pydantic import BaseModel


class ItemBase(BaseModel):
    sku: str
    name: str
    uom: str = "PCS"
    cost_method: str = "moving_avg"


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    uom: str | None = None
    cost_method: str | None = None


class ItemOut(ItemBase):
    id: int

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    code: str
    name: str
    tax_id: str | None = None
    payment_term: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    tax_id: str | None = None
    payment_term: str | None = None


class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


class VendorBase(BaseModel):
    code: str
    name: str
    tax_id: str | None = None
    payment_term: str | None = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: str | None = None
    tax_id: str | None = None
    payment_term: str | None = None


class VendorOut(VendorBase):
    id: int

    class Config:
        from_attributes = True


class WarehouseBase(BaseModel):
    code: str
    name: str


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None


class WarehouseOut(WarehouseBase):
    id: int

    class Config:
        from_attributes = True
