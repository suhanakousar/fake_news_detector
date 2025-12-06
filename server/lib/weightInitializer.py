import torch

def init_empty_weights(model):
    """
    Initialize empty weights for a model.
    
    Args:
        model: The model to initialize weights for
    """
    for param in model.parameters():
        if len(param.shape) > 1:
            torch.nn.init.xavier_uniform_(param)
        else:
            torch.nn.init.zeros_(param)
    return model 