"""
Logique de retry pour les requêtes API
Gestion intelligente des erreurs avec retry automatique
"""
import time
import random
from typing import Callable, Any, Optional, Type, Tuple
from functools import wraps


class RetryConfig:
    """Configuration pour les retries"""
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions


def retry_with_backoff(
    config: Optional[RetryConfig] = None,
    on_retry: Optional[Callable[[int, Exception], None]] = None
):
    """
    Decorator pour retry avec backoff exponentiel
    
    Args:
        config: Configuration du retry
        on_retry: Callback appelé à chaque retry (attempt_number, exception)
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(1, config.max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    # Ne pas retry si c'est la dernière tentative
                    if attempt >= config.max_attempts:
                        break
                    
                    # Calculer le délai avec backoff exponentiel
                    delay = min(
                        config.base_delay * (config.exponential_base ** (attempt - 1)),
                        config.max_delay
                    )
                    
                    # Ajouter du jitter pour éviter le thundering herd
                    if config.jitter:
                        delay = delay * (0.5 + random.random() * 0.5)
                    
                    # Appeler le callback si fourni
                    if on_retry:
                        try:
                            on_retry(attempt, e)
                        except:
                            pass  # Ignorer les erreurs dans le callback
                    
                    # Attendre avant de retry
                    time.sleep(delay)
            
            # Si on arrive ici, toutes les tentatives ont échoué
            raise last_exception
        
        return wrapper
    return decorator


def retry_on_network_error(max_attempts: int = 3):
    """
    Decorator spécialisé pour les erreurs réseau
    
    Args:
        max_attempts: Nombre maximum de tentatives
    """
    config = RetryConfig(
        max_attempts=max_attempts,
        base_delay=0.5,
        max_delay=10.0,
        exponential_base=2.0,
        retryable_exceptions=(ConnectionError, TimeoutError, OSError)
    )
    return retry_with_backoff(config)


def retry_on_server_error(max_attempts: int = 3):
    """
    Decorator spécialisé pour les erreurs serveur (5xx)
    
    Args:
        max_attempts: Nombre maximum de tentatives
    """
    config = RetryConfig(
        max_attempts=max_attempts,
        base_delay=1.0,
        max_delay=30.0,
        exponential_base=2.0,
        retryable_exceptions=(Exception,)  # À adapter selon les besoins
    )
    return retry_with_backoff(config)

