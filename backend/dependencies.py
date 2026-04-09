from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from models import User, RoleEnum
from auth import decode_token
from schemas import TokenData
import models

security = HTTPBearer()

optional_security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if credentials is None:
        return None
    
    payload = decode_token(credentials.credentials)
    if payload is None:
        return None
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user


def require_role(allowed_roles: List[RoleEnum]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(require_role([RoleEnum.admin]))) -> User:
    return current_user


def require_committee(current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.committee]))) -> User:
    return current_user


def require_finance(current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.finance]))) -> User:
    return current_user


def require_auditor(current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.auditor]))) -> User:
    return current_user